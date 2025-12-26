import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import type { RootState } from '../../store';
import {
    setExpandedOrderId,
    setActiveUnitIndex,
    setShowFullDetails,
    updateTrackingData
} from '../../store/slices/ordersSlice';
import { setProofModal } from '../../store/slices/uiSlice';
import Pagination from '../common/Pagination';
import './TrackingTab.css'; // Import external CSS

const TrackingTab: React.FC = () => {
    const dispatch = useAppDispatch();
    const { pendingUnits, trackingData, expansion } = useAppSelector((state: RootState) => state.orders);
    const { expandedOrderId, activeUnitIndex, showFullDetails } = expansion;
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    // Filter for PAID or Approved orders
    const approvedOrders = pendingUnits.filter((entry: any) => {
        const status = entry.order?.paymentStatus;
        const isPaidOrApproved = status === 'PAID' || status === 'Approved';

        if (!isPaidOrApproved) return false;

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const orderId = entry.order?.id ? String(entry.order.id).toLowerCase() : '';
            const investorName = entry.investor?.name ? String(entry.investor.name).toLowerCase() : '';
            return orderId.includes(query) || investorName.includes(query);
        }

        return true;
    });

    // Reset page on search change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = approvedOrders.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(approvedOrders.length / itemsPerPage);

    const handleStageUpdateLocal = (orderId: string, buffaloNum: number, nextStageId: number) => {
        const now = new Date();
        const date = now.toLocaleDateString('en-GB').replace(/\//g, '-');
        const time = now.toLocaleTimeString('en-GB');
        // In a real app this would likely be an API call
        dispatch(updateTrackingData({ key: `${orderId}-${buffaloNum}`, stageId: nextStageId, date, time }));
    };

    const getTrackingForBuffalo = (orderId: string, buffaloNum: number, initialStatus: string) => {
        const key = `${orderId}-${buffaloNum}`;
        if (trackingData[key]) return trackingData[key];
        return { currentStageId: 1, history: { 1: { date: '24-05-2025', time: '10:30:00' } } };
    };

    const formatIndiaDateHeader = (val: any) => {
        if (!val || (typeof val !== 'string' && typeof val !== 'number')) return String(val || '-');
        const date = new Date(val);
        if (date instanceof Date && !isNaN(date.getTime())) {
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}-${month}-${year}`;
        }
        return String(val);
    };

    const formatIndiaDate = (val: any) => {
        if (!val || (typeof val !== 'string' && typeof val !== 'number')) return String(val);
        const date = new Date(val);
        if (date instanceof Date && !isNaN(date.getTime()) && String(val).length > 10) {
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
        }
        return String(val);
    };

    return (
        <div className="tracking-tab-container">
            <div className="tracking-header">
                <h2 className="tracking-title">Tracking Orders</h2>
                <input
                    type="text"
                    placeholder="Search By Order ID, Investor Name"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="tracking-search-input"
                />
            </div>
            <div className="tracking-table-card">
                <div className="tracking-table-wrapper">
                    <table className="tracking-table">
                        <thead>
                            <tr className="tracking-table-header-row">
                                <th className="tracking-table-th">S.No</th>
                                <th className="tracking-table-th">User Name</th>
                                <th className="tracking-table-th">Status</th>
                                <th className="tracking-table-th">Units</th>
                                <th className="tracking-table-th">Order ID</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="tracking-no-data-cell">
                                        No approved orders found.
                                    </td>
                                </tr>
                            ) : (
                                currentItems.map((entry: any, index: number) => {
                                    const { order, investor, transaction: tx } = entry;
                                    const unit = order || {};
                                    const isExpanded = expandedOrderId === unit.id;

                                    return (
                                        <React.Fragment key={`${order.id}-${index}`}>
                                            <tr className="tracking-table-row">
                                                <td className="tracking-table-td">
                                                    {(currentPage - 1) * itemsPerPage + index + 1}
                                                </td>
                                                <td className="tracking-table-td-bold">{investor?.name || 'N/A'}</td>
                                                <td className="tracking-table-td-middle">
                                                    <span className="payment-status-badge-approved">
                                                        Approved
                                                    </span>
                                                </td>
                                                <td className="tracking-table-td-bold">{order.numUnits}</td>
                                                <td className="tracking-table-td">
                                                    <button
                                                        onClick={() => {
                                                            if (isExpanded) {
                                                                dispatch(setExpandedOrderId(null));
                                                                dispatch(setActiveUnitIndex(null));
                                                                dispatch(setShowFullDetails(false));
                                                            } else {
                                                                dispatch(setExpandedOrderId(unit.id));
                                                                dispatch(setActiveUnitIndex(0));
                                                                dispatch(setShowFullDetails(false));
                                                            }
                                                        }}
                                                        className="tracking-order-id-btn">
                                                        {order.id}
                                                    </button>
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr className="tracking-expanded-row">
                                                    <td colSpan={5} className="tracking-expanded-cell">
                                                        <div className="order-expand-animation tracking-expand-container">
                                                            <div className="tracking-details-section">
                                                                <div className="tracking-details-card">
                                                                    <div className={`tracking-details-header ${showFullDetails ? 'expanded' : ''}`}>
                                                                        <div className="tracking-info-grid">
                                                                            {[
                                                                                { label: 'Payment Method', value: tx?.paymentType || '-' },
                                                                                { label: 'Total Amount', value: `₹${tx?.amount ?? '-'}` },
                                                                                { label: 'Approval Date', value: formatIndiaDateHeader(unit.updatedAt || unit.updated_at || unit.paymentApprovedAt || tx?.payment_date) },
                                                                                { label: 'Payment Mode', value: tx?.paymentType || 'MANUAL_PAYMENT' },
                                                                                { label: 'Breed ID', value: unit.breedId || 'MURRAH-001' }
                                                                            ].map((item, idx) => (
                                                                                <div key={idx} className="tracking-info-item">
                                                                                    <div className="tracking-info-label">{item.label}</div>
                                                                                    <div className="tracking-info-value">{item.value}</div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                        <button
                                                                            onClick={() => dispatch(setShowFullDetails(!showFullDetails))}
                                                                            className={`tracking-details-toggle-btn ${showFullDetails ? 'rotated' : ''}`}
                                                                        >
                                                                            ∨
                                                                        </button>
                                                                    </div>

                                                                    {showFullDetails && (
                                                                        <div className="order-expand-animation tracking-extra-details-grid">
                                                                            {(() => {
                                                                                const excludedKeys = ['id', 'name', 'mobile', 'email', 'amount', 'paymentType', 'paymentStatus', 'numUnits', 'order', 'transaction', 'investor', 'password', 'token', 'images', 'cpfUnitCost', 'unitCost', 'base_unit_cost', 'baseUnitCost', 'cpf_unit_cost', 'unit_cost', 'otp', 'first_name', 'last_name', 'otp_verified', 'otp_created_at', 'is_form_filled', 'occupation', 'updatedAt', 'updated_at', 'createdAt', 'created_at', 'breedId', 'breed_id', 'paymentApprovedAt', 'receipt_date', 'date', 'approved_at', 'approvedAt', 'order_date', 'payment_date'];
                                                                                const combinedData = { ...unit, ...tx, ...investor };

                                                                                return Object.entries(combinedData)
                                                                                    .filter(([key, value]) => {
                                                                                        const isExcluded = excludedKeys.includes(key);
                                                                                        const lowerKey = key.toLowerCase();
                                                                                        const isUrlKey = lowerKey.includes('url') || lowerKey.includes('link') || lowerKey.includes('proof') || lowerKey.includes('image');
                                                                                        const isUrlValue = typeof value === 'string' && (value.startsWith('http') || value.startsWith('/api/'));
                                                                                        return !isExcluded && !isUrlKey && !isUrlValue && value !== null && value !== undefined && typeof value !== 'object';
                                                                                    })
                                                                                    .map(([key, value], idx) => (
                                                                                        <div key={`extra-${idx}`} className="tracking-info-item">
                                                                                            <div className="tracking-info-label">
                                                                                                {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())}
                                                                                            </div>
                                                                                            <div className="tracking-info-value">{formatIndiaDate(value)}</div>
                                                                                        </div>
                                                                                    ));
                                                                            })()}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className="tracking-interface-container">
                                                                <div className="tracking-units-sidebar">
                                                                    <div className="tracking-units-title">Select Unit</div>
                                                                    <div className="units-sidebar tracking-units-list">
                                                                        {Array.from({ length: unit.numUnits || 0 }).map((_, i) => (
                                                                            <button
                                                                                key={i}
                                                                                onClick={() => dispatch(setActiveUnitIndex(activeUnitIndex === i ? null : i))}
                                                                                className={`tracking-unit-btn ${activeUnitIndex === i ? 'active' : 'inactive'}`}
                                                                            >
                                                                                <span>Unit {i + 1}</span>
                                                                                <span className="tracking-unit-btn-subtitle">{unit.breedId || 'MURRAH-001'}</span>
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>

                                                                <div className="tracking-main-content">
                                                                    {activeUnitIndex !== null ? (
                                                                        <div className="order-expand-animation tracking-buffalo-grid">
                                                                            {[1, 2].map((buffaloNum) => {
                                                                                const tracker = trackingData[`${unit.id}-${buffaloNum}`] || getTrackingForBuffalo(unit.id, buffaloNum, unit.paymentStatus);
                                                                                const currentStageId = tracker.currentStageId;

                                                                                const timelineStages = [
                                                                                    { id: 1, label: 'Order Placed' },
                                                                                    { id: 2, label: 'Payment Pending' },
                                                                                    { id: 3, label: 'Order Confirm' },
                                                                                    { id: 4, label: 'Order Approved' },
                                                                                    { id: 5, label: 'Order in Market' },
                                                                                    { id: 6, label: 'Order in Quarantine' },
                                                                                    { id: 7, label: 'In Transit' },
                                                                                    { id: 8, label: 'Order Delivered' }
                                                                                ];

                                                                                return (
                                                                                    <div key={buffaloNum} className="tracking-buffalo-card">
                                                                                        <div className="tracking-buffalo-title">
                                                                                            Buffalo {buffaloNum} Progress
                                                                                        </div>

                                                                                        <div className="tracking-timeline-container">
                                                                                            {timelineStages.map((stage, idx) => {
                                                                                                const isLast = idx === timelineStages.length - 1;
                                                                                                const isStepCompleted = stage.id < currentStageId;
                                                                                                const isCurrent = stage.id === currentStageId;
                                                                                                const stageDate = tracker.history[stage.id]?.date || '-';
                                                                                                const stageTime = tracker.history[stage.id]?.time || '-';

                                                                                                return (
                                                                                                    <div key={stage.id} className="tracking-timeline-item">
                                                                                                        <div className="tracking-timeline-date-col">
                                                                                                            <div className="tracking-timeline-date">{stageDate}</div>
                                                                                                        </div>

                                                                                                        <div className="tracking-timeline-marker-col">
                                                                                                            {!isLast && (
                                                                                                                <div className={`tracking-timeline-line ${isStepCompleted ? 'completed' : 'pending'}`} />
                                                                                                            )}
                                                                                                            <div className={`tracking-timeline-dot ${isStepCompleted ? 'completed' : isCurrent ? 'current' : 'pending'}`}>
                                                                                                                {isStepCompleted ? '✓' : stage.id}
                                                                                                            </div>
                                                                                                        </div>

                                                                                                        <div className={`tracking-timeline-content-col ${isLast ? 'last' : ''}`}>
                                                                                                            <div className="tracking-timeline-header">
                                                                                                                <div className={`tracking-timeline-label ${isStepCompleted ? 'completed' : isCurrent ? 'current' : 'pending'}`}>
                                                                                                                    {stage.label}
                                                                                                                </div>

                                                                                                                {isCurrent && (
                                                                                                                    <button
                                                                                                                        className="tracking-update-btn"
                                                                                                                        onClick={() => handleStageUpdateLocal(unit.id, buffaloNum, stage.id + 1)}
                                                                                                                    >
                                                                                                                        {stage.id === 8 ? 'Confirm Delivery' : 'Update'}
                                                                                                                    </button>
                                                                                                                )}

                                                                                                                {isStepCompleted && (
                                                                                                                    <span className="tracking-completed-badge">
                                                                                                                        {stage.id === 8 ? 'Delivered' : 'Completed'}
                                                                                                                    </span>
                                                                                                                )}
                                                                                                            </div>
                                                                                                            <div className="tracking-timeline-time">
                                                                                                                {stageTime !== '-' ? stageTime : ''}
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                );
                                                                                            })}
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    ) : (
                                                                        <div className="tracking-no-selection-placeholder">
                                                                            Select a unit to see tracking progress
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
            />
        </div>
    );
};

export default TrackingTab;
