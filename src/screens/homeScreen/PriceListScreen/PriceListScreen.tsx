import React from 'react';
import { StyleSheet, View } from 'react-native';
import Header from '../../../components/Header/Header';
import styles from './PriceListStyles';

const PriceListScreen = () => {
  return (
    <View style={styles.container}>
      <Header title={"price"}  leftComponent/>
    </View>
  );
}



export default PriceListScreen;
