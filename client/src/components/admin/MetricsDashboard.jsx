import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Nav, Form, Spinner } from 'react-bootstrap';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import axios from 'axios';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const MetricsDashboard = () => {
    const [activeService, setActiveService] = useState('gemini');
    const [timeRange, setTimeRange] = useState('24h');
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMetrics();
        const interval = setInterval(fetchMetrics, 30000); // Update every 30 seconds
        return () => clearInterval(interval);
    }, [activeService, timeRange]);

    const fetchMetrics = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `http://localhost:5000/api/metrics/${activeService}?timeRange=${timeRange}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log('Fetched metrics:', response.data);
            setMetrics(response.data);
        } catch (error) {
            console.error('Failed to fetch metrics:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    usePointStyle: true,
                    padding: 15,
                    font: {
                        size: 12,
                        family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif"
                    }
                }
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                titleColor: '#000',
                bodyColor: '#666',
                borderColor: '#ddd',
                borderWidth: 1,
                padding: 12,
                displayColors: true,
                titleFont: {
                    size: 13,
                    weight: 'bold'
                },
                bodyFont: {
                    size: 12
                },
                callbacks: {
                    label: function (context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            if (context.chart.canvas.id === 'success-rate') {
                                label += context.parsed.y.toFixed(1) + '%';
                            } else {
                                label += context.parsed.y.toFixed(0) + 'ms';
                            }
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(0, 0, 0, 0.1)',
                    drawBorder: false,
                    lineWidth: 0.5
                },
                ticks: {
                    padding: 10,
                    font: {
                        size: 11,
                        family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif"
                    },
                    callback: function (value) {
                        if (this.chart.canvas.id === 'success-rate') {
                            return value + '%';
                        }
                        return value + 'ms';
                    }
                }
            },
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    maxRotation: 45,
                    minRotation: 45,
                    padding: 10,
                    autoSkip: true,
                    maxTicksLimit: 24,
                    font: {
                        size: 10,
                        family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif"
                    }
                }
            }
        },
        elements: {
            line: {
                tension: 0.3,
                borderWidth: 2,
                borderJoinStyle: 'round',
                capBezierPoints: true
            },
            point: {
                radius: 2,
                hitRadius: 8,
                hoverRadius: 4,
                borderWidth: 2
            }
        },
        interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
        },
        animation: {
            duration: 750,
            easing: 'easeInOutQuart'
        }
    };

    // Customize Y-axis ranges for each chart type
    const successRateOptions = {
        ...chartOptions,
        scales: {
            ...chartOptions.scales,
            y: {
                ...chartOptions.scales.y,
                min: 80,
                max: 100,
                ticks: {
                    ...chartOptions.scales.y.ticks,
                    stepSize: 5
                }
            }
        }
    };

    const responseTimeOptions = {
        ...chartOptions,
        scales: {
            ...chartOptions.scales,
            y: {
                ...chartOptions.scales.y,
                min: 0,
                max: 2500,
                ticks: {
                    ...chartOptions.scales.y.ticks,
                    stepSize: 500
                }
            }
        }
    };

    const latencyOptions = {
        ...chartOptions,
        scales: {
            ...chartOptions.scales,
            y: {
                ...chartOptions.scales.y,
                min: 0,
                max: 6000,
                ticks: {
                    ...chartOptions.scales.y.ticks,
                    stepSize: 1000
                }
            }
        }
    };

    const getTimeLabels = () => {
        if (!metrics?.timeSeriesData) return [];
        return metrics.timeSeriesData.map(d => formatTimestamp(d.timestamp));
    };

    const successRateData = {
        labels: getTimeLabels(),
        datasets: [
            {
                label: 'Success Rate (%)',
                data: metrics?.timeSeriesData?.map(d => d.successRate) || [],
                borderColor: 'rgb(34, 197, 94)',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                fill: true,
                tension: 0.3,
                pointStyle: 'circle'
            },
        ],
    };

    const responseTimeData = {
        labels: getTimeLabels(),
        datasets: [
            {
                label: 'Average Response Time (ms)',
                data: metrics?.timeSeriesData?.map(d => d.averageLatency) || [],
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.3,
                pointStyle: 'circle'
            },
        ],
    };

    const latencyData = {
        labels: getTimeLabels(),
        datasets: [
            {
                label: '95th Percentile (P95) - 95% of requests are faster than this',
                data: metrics?.timeSeriesData?.map(d => d.p95Latency) || [],
                borderColor: 'rgb(245, 158, 11)',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                fill: true,
                tension: 0.3,
                pointStyle: 'circle'
            },
            {
                label: '99th Percentile (P99) - 99% of requests are faster than this',
                data: metrics?.timeSeriesData?.map(d => d.p99Latency) || [],
                borderColor: 'rgb(239, 68, 68)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                fill: true,
                tension: 0.3,
                pointStyle: 'circle'
            },
        ],
    };

    return (
        <Container fluid className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="mb-0">API Metrics Dashboard</h2>
                <Form.Select
                    style={{ width: 'auto' }}
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                >
                    <option value="1h">Last Hour</option>
                    <option value="24h">Last 24 Hours</option>
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                </Form.Select>
            </div>

            <Nav variant="tabs" className="mb-4">
                <Nav.Item>
                    <Nav.Link
                        active={activeService === 'gemini'}
                        onClick={() => setActiveService('gemini')}
                    >
                        Gemini
                    </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link
                        active={activeService === 'ocr'}
                        onClick={() => setActiveService('ocr')}
                    >
                        OCR
                    </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link
                        active={activeService === 'smart-query'}
                        onClick={() => setActiveService('smart-query')}
                    >
                        Smart Query
                    </Nav.Link>
                </Nav.Item>
            </Nav>

            {loading ? (
                <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                </div>
            ) : (
                <Row>
                    <Col md={4}>
                        <Card className="mb-4 shadow-sm">
                            <Card.Header className="bg-light">Success Rate</Card.Header>
                            <Card.Body>
                                <div style={{ height: '300px' }}>
                                    <Line id="success-rate" options={successRateOptions} data={successRateData} />
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card className="mb-4 shadow-sm">
                            <Card.Header className="bg-light">Response Time</Card.Header>
                            <Card.Body>
                                <div style={{ height: '300px' }}>
                                    <Line id="response-time" options={responseTimeOptions} data={responseTimeData} />
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card className="mb-4 shadow-sm">
                            <Card.Header className="bg-light">
                                <div className="d-flex justify-content-between align-items-center">
                                    <span>Latency Percentiles</span>
                                    <small className="text-muted">Higher percentiles show worst-case performance</small>
                                </div>
                            </Card.Header>
                            <Card.Body>
                                <div style={{ height: '300px' }}>
                                    <Line id="latency" options={latencyOptions} data={latencyData} />
                                </div>
                                <div className="mt-3 small text-muted">
                                    <ul className="mb-0">
                                        <li>P95: 95% of requests are faster than this value</li>
                                        <li>P99: 99% of requests are faster than this value</li>
                                    </ul>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            )}
        </Container>
    );
};

export default MetricsDashboard; 