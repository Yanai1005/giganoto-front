// src/components/ErrorBoundary.jsx - React Error Boundary for Joy-Con components
import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Log the error details
        console.error('ErrorBoundary caught an error:', error, errorInfo);

        this.setState({
            error: error,
            errorInfo: errorInfo
        });
    }

    render() {
        if (this.state.hasError) {
            // Custom fallback UI
            return (
                <div style={{
                    padding: '20px',
                    background: '#ffe6e6',
                    border: '1px solid #ff9999',
                    borderRadius: '5px',
                    margin: '10px',
                    color: '#cc0000'
                }}>
                    <h3>🚨 Component Error</h3>
                    <p>Something went wrong with the Joy-Con component.</p>

                    {this.props.showDetails && this.state.error && (
                        <details style={{ marginTop: '10px' }}>
                            <summary>Error Details</summary>
                            <pre style={{
                                background: '#f5f5f5',
                                padding: '10px',
                                borderRadius: '3px',
                                fontSize: '12px',
                                overflow: 'auto',
                                maxHeight: '200px'
                            }}>
                                {this.state.error.toString()}
                                {this.state.errorInfo.componentStack}
                            </pre>
                        </details>
                    )}

                    <button
                        onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                        style={{
                            marginTop: '10px',
                            padding: '5px 10px',
                            background: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer'
                        }}
                    >
                        Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
