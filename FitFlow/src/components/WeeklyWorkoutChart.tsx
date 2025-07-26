// src/components/WeeklyWorkoutChart.tsx
import React from 'react'
import { View, Text, Dimensions, StyleSheet } from 'react-native'
import { BarChart } from 'react-native-chart-kit'
import { format, parseISO, isValid } from 'date-fns'

type DayData = { date?: string; workouts?: number }

interface Props {
  data?: DayData[]
}

export default function WeeklyWorkoutChart({ data = [] }: Props) {
  // Filter out entries without a valid ISO date
  const validData = data.filter(d => {
    const dt = d.date ? parseISO(d.date) : null
    return dt instanceof Date && isValid(dt) && typeof d.workouts === 'number'
  })

  // Prepare labels and datasets
  const labels = validData.map(d => format(parseISO(d.date!), 'dd/MM'))
  const values = validData.map(d => d.workouts!)

  // Chart config
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

  const screenWidth = Dimensions.get('window').width - 32

  return (
    <View style={styles.container}>
      {validData.length > 0 ? (
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
    borderRadius: 12,
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