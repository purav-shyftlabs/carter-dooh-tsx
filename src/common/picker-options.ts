export const TIME_PICKER_START_DATE = new Array(24).fill('').map((_, index) => ({
  label: `${index.toString().padStart(2, '0')}: 00`,
  value: `${index.toString().padStart(2, '0')}:00`,
}));

export const NON_ZERO_TIME_PICKER_END_DATE = [
  ...TIME_PICKER_START_DATE.filter(option => option.value !== '00:00'),
  { label: '23:59', value: '23:59' },
];