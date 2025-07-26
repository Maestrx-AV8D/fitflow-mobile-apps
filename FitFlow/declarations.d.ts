// declarations.d.ts
declare module 'victory-native' {
  import type { ComponentType } from 'react'
  interface VictoryCommonProps {
    data?: any[]
    x?: string | ((d: any) => any)
    y?: string | ((d: any) => any)
    theme?: object
  }
  export const VictoryChart: ComponentType<any>
  export const VictoryBar:   ComponentType<VictoryCommonProps>
  // add other exports as you need them…
}