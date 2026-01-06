import React from 'react';
import InternalLayout from '@/layouts/internal-layout/internal-layout';
import AddScreen from '../components/add-screen.component';
import { NextPageWithLayout } from '@/types/common';

const AddScreenContainer: NextPageWithLayout = () => {
  return <AddScreen />;
};

AddScreenContainer.getLayout = (page: React.ReactNode) => (
  <InternalLayout head={{ title: 'Add Screen', description: 'Pair a new screen to your account' }}>
    {page}
  </InternalLayout>
);

export default AddScreenContainer;

