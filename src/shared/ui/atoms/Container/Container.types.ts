import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export interface ContainerProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}
