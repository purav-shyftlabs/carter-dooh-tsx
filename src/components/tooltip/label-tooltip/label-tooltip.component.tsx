import { Tooltip } from 'shyftlabs-dsl';
import { truncateString } from '@/common/helpers';
import Hyperlink from '../../hyperlink/hyperlink.component';
import Button, { IButtonProps } from '../../button/button.component';
import styles from './label-tooltip.module.scss';

interface TLabelToolTip {
  trimLength?: number;
  label?: string;
  url?: string;
  urlTarget?: string;
  labelClassName?: string;
  onClick?: () => void;
  buttonProps?: Omit<IButtonProps, 'variant' | 'title' | 'onClick'>;
  testId?: string;
}

const LabelToolTip: React.FC<TLabelToolTip> = props => {
  const { trimLength = 30, onClick, urlTarget, label = '', url, labelClassName = '', buttonProps = {} } = props;
  const truncatedLabel = truncateString(label, trimLength) ?? '-';
  return (
    <Tooltip title={Number(label?.length) > trimLength ? label : undefined}>
      {onClick ? (
        <span data-testid={props.testId}>
          <Button
            {...buttonProps}
            title={truncatedLabel}
            variant="text"
            onClick={onClick}
            className={styles.button}
          />
        </span>
      ) : (
        <span className={labelClassName} data-testid={props.testId}>
          {url ? <Hyperlink url={url} target={urlTarget} label={truncatedLabel} /> : truncatedLabel}
        </span>
      )}
    </Tooltip>
  );
};

export default LabelToolTip;
