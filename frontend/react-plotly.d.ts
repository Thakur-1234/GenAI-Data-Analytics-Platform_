declare module 'react-plotly.js' {
  import { Component } from 'react'
  
  // Import plotly.js
  import('plotly.js-dist-min')
  
  interface PlotParams {
    data?: any[]
    layout?: any
    frames?: any[]
    config?: any
    style?: React.CSSProperties
    useResizeHandler?: boolean
    className?: string
  }
  
  class Plot extends Component<PlotParams> {}
  export default Plot
}
