import React from 'react';
import TabNavigation, { TabNavigationProps } from './TabNavigation';

export const HomeNavigation: React.FC<TabNavigationProps> = (props) => {
  return <TabNavigation {...props} />;
};

export default HomeNavigation;
