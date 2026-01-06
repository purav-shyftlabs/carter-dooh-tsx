import React, { useState, useEffect, useRef } from 'react';
import { Button } from 'shyftlabs-dsl';
import { ArrowLeft, Copy, Check, X } from 'lucide-react';
import { useRouter } from 'next/router';
import styles from '../styles/add-screen.module.scss';
import { screensService } from '@/services/screens/screens.service';
import type { ScreenPairingCode, PairingCodeStatus } from '@/types/screens';
import PageHeader from '@/components/page-header/page-header.component';
import ROUTES from '@/common/routes';
import useAlert from '@/contexts/alert/alert.hook';
import { AlertVariant } from '@/contexts/alert/alert.provider';
import useUser from '@/contexts/user-data/user-data.hook';

const PLAYER_URL: string = String(process.env.NEXT_PUBLIC_PLAYER_URL || 'https://player.carter-dooh.com');

const AddScreen: React.FC = () => {
  const router = useRouter();
  const { showAlert } = useAlert();
  const { user } = useUser();
  const [pairingCode, setPairingCode] = useState<ScreenPairingCode | null>(null);
  const [codeStatus, setCodeStatus] = useState<PairingCodeStatus | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [copied, setCopied] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get account ID from user
  const accountId = user?.accountId || (user as { account?: number })?.account || 1;

  useEffect(() => {
    return () => {
      // Cleanup intervals on unmount
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
      }
    };
  }, []);

  // Calculate time remaining
  useEffect(() => {
    if (!pairingCode) return;

    const updateTimeRemaining = () => {
      const now = new Date().getTime();
      const expiresAt = new Date(pairingCode.expiresAt).getTime();
      const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
      setTimeRemaining(remaining);

      if (remaining === 0 && timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
      }
    };

    updateTimeRemaining();
    timeIntervalRef.current = setInterval(updateTimeRemaining, 1000);

    return () => {
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
      }
    };
  }, [pairingCode]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleGenerateCode = async () => {
    try {
      setIsGenerating(true);
      const response = await screensService.generatePairingCode({
        accountId: Number(accountId),
        expiryMinutes: 15,
      });
      setPairingCode(response);
      setCodeStatus({
        id: response.id,
        pairingCode: response.pairingCode,
        status: response.status,
        expiresAt: response.expiresAt,
        createdAt: response.createdAt,
      });
      setIsPolling(true);
      startPolling(response.id);
    } catch (error) {
      console.error('Error generating pairing code:', error);
      const errorMessage =
        error && typeof error === 'object' && 'response' in error
          ? ((error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
              'Failed to generate pairing code')
          : 'Failed to generate pairing code';
      showAlert(errorMessage, AlertVariant.ERROR);
    } finally {
      setIsGenerating(false);
    }
  };

  const startPolling = (codeId: number) => {
    // Clear any existing polling
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    pollIntervalRef.current = setInterval(async () => {
      try {
        const status = await screensService.getPairingCodeStatus(codeId);
        setCodeStatus(status);

        if (status.status === 'used') {
          // Success! Screen paired
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
          }
          setIsPolling(false);
          showAlert('Screen paired successfully!', AlertVariant.SUCCESS);
          setTimeout(() => {
            router.push(ROUTES.BILLBOARD.LIST);
          }, 2000);
        } else if (status.status === 'failed') {
          // Pairing failed
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
          }
          setIsPolling(false);
          showAlert('Pairing failed. Please try generating a new code.', AlertVariant.ERROR);
        } else if (status.status === 'expired' || status.status === 'cancelled') {
          // Code expired or cancelled
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
          }
          setIsPolling(false);
          if (status.status === 'expired') {
            showAlert('Pairing code has expired', AlertVariant.ERROR);
          } else {
            showAlert('Pairing code was cancelled', AlertVariant.INFO);
          }
        }
      } catch (error) {
        console.error('Error polling code status:', error);
      }
    }, 3000); // Poll every 3 seconds
  };

  const handleCancel = async () => {
    if (!pairingCode) return;

    try {
      await screensService.cancelPairingCode(pairingCode.id);
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      setIsPolling(false);
      setPairingCode(null);
      setCodeStatus(null);
      showAlert('Pairing cancelled', AlertVariant.INFO);
    } catch (error) {
      console.error('Error cancelling pairing:', error);
      showAlert('Failed to cancel pairing', AlertVariant.ERROR);
    }
  };

  const handleCopyLink = () => {
    const link = `${String(PLAYER_URL)}/pair`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyCode = () => {
    if (pairingCode) {
      navigator.clipboard.writeText(pairingCode.pairingCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={styles.addScreenContainer}>
      <PageHeader
        title="Add Screen"
        ActionComponent={() => (
          <Button
            label="Back"
            icon={<ArrowLeft />}
            onClick={() => router.push(ROUTES.BILLBOARD.LIST)}
            variant="tertiary"
            size="small"
            iconPosition="left"
          />
        )}
      />

      <div className={styles.content}>
        {!pairingCode ? (
          <div className={styles.initialState}>
            <div className={styles.iconContainer}>
              <div className={styles.icon}>📺</div>
            </div>
            <h2>Pair a New Screen</h2>
            <p>Generate a pairing code to connect a new screen to your account.</p>
            <p className={styles.subtext}>
              The code will be valid for 15 minutes. Open the web player on your screen device and enter the code.
            </p>
            <Button
              label={isGenerating ? 'Generating...' : 'Generate Pairing Code'}
              onClick={handleGenerateCode}
              variant="primary"
              size="medium"
              disabled={isGenerating}
            />
          </div>
        ) : (
          <div className={styles.pairingState}>
            <div className={styles.pairingHeader}>
              <h2>Pair Your Screen</h2>
              <p>Follow these steps to pair your screen</p>
            </div>

            <div className={styles.pairingMethod}>
              <div className={styles.methodHeader}>
                <span className={styles.methodIcon}>🌐</span>
                <span className={styles.methodLabel}>Web Player</span>
              </div>
            </div>

            <div className={styles.pairingInstructions}>
              <div className={styles.codeSection}>
                <h3>Pairing Code</h3>
                <div className={styles.codeDisplay}>
                  <div className={styles.code}>{pairingCode.pairingCode}</div>
                  <Button
                    label={copied ? 'Copied!' : 'Copy Code'}
                    icon={copied ? <Check size={16} /> : <Copy size={16} />}
                    onClick={handleCopyCode}
                    variant="tertiary"
                    size="small"
                    iconPosition="left"
                  />
                </div>
                <div className={styles.timeRemaining}>
                  {timeRemaining > 0 ? (
                    <span>Expires in: {formatTime(timeRemaining)}</span>
                  ) : (
                    <span className={styles.expired}>Code expired</span>
                  )}
                </div>
              </div>

              <div className={styles.linkSection}>
                <h3>Open on Your Screen Device</h3>
                <p>Open this link in the browser where your screen will run:</p>
                <div className={styles.linkDisplay}>
                  <a href={`${String(PLAYER_URL)}/pair`} target="_blank" rel="noopener noreferrer" className={styles.link}>
                    {String(PLAYER_URL)}/pair
                  </a>
                 
                </div>
              </div>

              <div className={styles.statusSection}>
                <div className={styles.statusIndicator}>
                  {isPolling && codeStatus?.status === 'pending' && (
                    <>
                      <div className={styles.spinner}></div>
                      <p>Waiting for screen to pair...</p>
                    </>
                  )}
                  {codeStatus?.status === 'used' && (
                    <>
                      <div className={styles.successIcon}>✓</div>
                      <p className={styles.successText}>Screen paired successfully!</p>
                    </>
                  )}
                  {codeStatus?.status === 'failed' && (
                    <>
                      <div className={styles.errorIcon}>✗</div>
                      <p className={styles.errorText}>Pairing failed. Please try generating a new code.</p>
                    </>
                  )}
                  {codeStatus?.status === 'expired' && (
                    <>
                      <div className={styles.errorIcon}>✗</div>
                      <p className={styles.errorText}>Pairing code has expired</p>
                    </>
                  )}
                  {codeStatus?.status === 'cancelled' && (
                    <>
                      <div className={styles.infoIcon}>ℹ</div>
                      <p className={styles.infoText}>Pairing code was cancelled</p>
                    </>
                  )}
                </div>
              </div>

              <div className={styles.actions}>
                <Button
                  label="Cancel"
                  icon={<X />}
                  onClick={handleCancel}
                  variant="tertiary"
                  size="medium"
                  iconPosition="left"
                />
                <Button
                  label="Generate New Code"
                  onClick={handleGenerateCode}
                  variant="secondary"
                  size="medium"
                  disabled={isGenerating}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddScreen;

