import React from "react";
import { View, Dimensions } from "react-native";
import { LineChart } from "react-native-chart-kit";

const { width } = Dimensions.get("window");

interface LineChartProps {
  labels: string[];
  data: number[];
  color?: string;
  yAxisLabel?: string;
}

export const LineChartComponent: React.FC<LineChartProps> = ({ labels, data, color, yAxisLabel }) => {
  return (
    <View style={{ marginBottom: 20, borderRadius: 12, backgroundColor: "#FFF", padding: 8 }}>
      <LineChart
        data={{ labels, datasets: [{ data }] }}
        width={width - 40}
        height={180}
        yAxisLabel={yAxisLabel || "$"}
        chartConfig={{
          backgroundColor: "#FFF",
          backgroundGradientFrom: "#FFF",
          backgroundGradientTo: "#FFF",
          decimalPlaces: 0,
          color: (opacity = 1) => color || `rgba(52,199,89,${opacity})`,
          labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`,
          style: { borderRadius: 12 },
          propsForDots: { r: "4", strokeWidth: "2", stroke: color || "#34C759" },
        }}
      />
    </View>
  );
};
