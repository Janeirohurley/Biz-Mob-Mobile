import React from "react";
import { View, Dimensions } from "react-native";
import { BarChart } from "react-native-chart-kit";

const { width } = Dimensions.get("window");

interface BarChartProps {
  labels: string[];
  data: number[];
  color?: string;
  yAxisLabel?: string;
}

export const BarChartComponent: React.FC<BarChartProps> = ({ labels, data, color, yAxisLabel }) => {
  return (
    <View style={{ borderRadius: 12, backgroundColor: "#FFF", padding: 8 }}>
      <BarChart
        data={{ labels, datasets: [{ data }] }}
        width={width - 40}
        height={220}
        yAxisLabel={yAxisLabel || "$"}
        yAxisSuffix="" // Added required prop
        chartConfig={{
          backgroundColor: "#FFF",
          backgroundGradientFrom: "#FFF",
          backgroundGradientTo: "#FFF",
          decimalPlaces: 0,
          color: (opacity = 1) => color || `rgba(0,122,255,${opacity})`,
          labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`,
          style: { borderRadius: 12 },
          propsForDots: { r: "6", strokeWidth: "2", stroke: color || "#007AFF" },
        }}
        verticalLabelRotation={45}
      />
    </View>
  );
};
