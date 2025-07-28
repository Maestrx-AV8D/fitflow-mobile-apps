import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { BarChart } from 'react-native-chart-kit';

type ActivityDay = { day: string; [activity: string]: number }

interface Props {
  data?: ActivityDay[]
}

export default function WeeklyWorkoutChart({ data = [] }: Props) {
  const screenWidth = Dimensions.get('window').width - 55
  // Prepare labels and values
  const labels = data.map(d => d.day)
  const values = data.map(d => {
    const { day, ...rest } = d
    return Object.values(rest).reduce((sum, val) => sum + val, 0)
  })

  const chartConfig = {
    backgroundColor: '#0E0C15',
    backgroundGradientFrom: '#15131D',
    backgroundGradientTo: '#252134',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(172, 106, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(202, 198, 221, ${opacity})`,
    style: { borderRadius: 12 },
    propsForBackgroundLines: { stroke: '#2E2A41' },
  }

  return (
    <View style={styles.container}>
      {data.length > 0 ? (
        <BarChart
          data={{
            labels,
            datasets: [{ data: values }],
          }}
          width={screenWidth}
          height={200}
          chartConfig={chartConfig}
          style={styles.chart}
          fromZero
          showValuesOnTopOfBars
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No workout data to display.</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    borderRadius: 12,
  },
  chart: {
    borderRadius: 6,
    marginLeft: -8
  },
  emptyContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#ADA8C3',
    fontSize: 14,
  },
})
