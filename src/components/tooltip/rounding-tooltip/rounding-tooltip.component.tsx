import { PropsWithChildren } from 'react';
import { Tooltip } from 'shyftlabs-dsl';
import { InfoIcon } from '@/lib/icons';
import { NUMERIC_ROUNDING_TWO_TOOLTIP } from '@/common/constants';

interface IRoundingTooltip {
  title?: string;
}

const RoundingTooltip: React.FC<PropsWithChildren<IRoundingTooltip>> = props => {
  const { title = NUMERIC_ROUNDING_TWO_TOOLTIP, children } = props;
  return (
    <>
      {children}
      <Tooltip title={title}>
        <InfoIcon size={16} />
      </Tooltip>
    </>
  );
};

export default RoundingTooltip;
