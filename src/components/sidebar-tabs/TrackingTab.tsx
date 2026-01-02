import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePersistentState } from '../../hooks/usePersistence';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import type { RootState } from '../../store';
import {
    setExpandedOrderId,
    setActiveUnitIndex,
    setShowFullDetails,
    updateTrackingData,
    setInitialTracking
} from '../../store/slices/ordersSlice';
import { setProofModal } from '../../store/slices/uiSlice';
import Pagination from '../common/Pagination';
import Loader from '../common/Loader';
import TableSkeleton from '../common/TableSkeleton';
import './TrackingTab.css'; // Import external CSS

const TrackingTab: React.FC = () => {
    const dispatch = useAppDispatch();
    const { pendingUnits, trackingData, expansion, loading: ordersLoading } = useAppSelector((state: RootState) => state.orders);
    const { expandedOrderId, activeUnitIndex, showFullDetails } = expansion;

    // URL Search Params for Pagination
    const [searchParams, setSearchParams] = useSearchParams();
    const currentPage = parseInt(searchParams.get('page') || '1', 10);

    const setCurrentPage = (page: number) => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            newParams.set('page', String(page));
            return newParams;
        });
    };

    // Persist search query
    const [searchQuery, setSearchQuery] = usePersistentState('tracking_searchQuery', '');

    // Local expansion state for timeline accordions (visual only, not critical to persist globally unless desired)
    const [expandedTrackerKeys, setExpandedTrackerKeys] = useState<Record<string, boolean>>({});
    const itemsPerPage = 15;

    // Persist expansion state (Same keys as OrdersTab to share state/context)
    useEffect(() => {
        if (expandedOrderId === null) localStorage.removeItem('orders_expandedOrderId');
        else localStorage.setItem('orders_expandedOrderId', expandedOrderId);

        if (activeUnitIndex === null) localStorage.removeItem('orders_activeUnitIndex');
        else localStorage.setItem('orders_activeUnitIndex', String(activeUnitIndex));

        localStorage.setItem('orders_showFullDetails', String(showFullDetails));
    }, [expandedOrderId, activeUnitIndex, showFullDetails]);

    // Persist tracking data (Same key as OrdersTab)
    useEffect(() => {
        localStorage.setItem('orders_trackingData', JSON.stringify(trackingData));
    }, [trackingData]);

    // Filter for PAID or Approved orders and REMOVE DUPLICATES
    const approvedOrders = useMemo(() => {
        const seenIds = new Set();
        return pendingUnits.filter((entry: any) => {
            const unit = entry.order || {};
            const status = unit.paymentStatus;
            const isPaidOrApproved = status === 'PAID' || status === 'Approved';

            if (!isPaidOrApproved) return false;

            // DEDUPLICATION: Ensure one row per Order ID
            if (unit.id) {
                if (seenIds.has(unit.id)) return false;
                seenIds.add(unit.id);
            }

            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const orderId = unit.id ? String(unit.id).toLowerCase() : '';
                const investorName = entry.investor?.name ? String(entry.investor.name).toLowerCase() : '';
                return orderId.includes(query) || investorName.includes(query);
            }

            return true;
        });
    }, [pendingUnits, searchQuery]);

    // Reset page on search change
    const prevSearchRef = useRef(searchQuery);
    useEffect(() => {
        if (prevSearchRef.current !== searchQuery) {
            setCurrentPage(1);
            prevSearchRef.current = searchQuery;
        }
    }, [searchQuery, setCurrentPage]);

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = approvedOrders.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(approvedOrders.length / itemsPerPage);

    // Ensure we don't stay on a page that no longer exists
    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        }
    }, [totalPages, currentPage, setCurrentPage]);

    const handleStageUpdateLocal = (orderId: string, buffaloNum: number, nextStageId: number, currentTrackerState?: any) => {
        const key = `${orderId}-${buffaloNum}`;
        const now = new Date();
        const date = now.toLocaleDateString('en-GB').replace(/\//g, '-');
        const time = now.toLocaleTimeString('en-GB');

        // Logic to construct new state
        let newState;
        if (trackingData[key]) {
            newState = JSON.parse(JSON.stringify(trackingData[key]));
        } else if (currentTrackerState) {
            newState = JSON.parse(JSON.stringify(currentTrackerState));
        } else {
            return;
        }

        // The stage user just clicked 'Update' on
        const completedStageId = nextStageId - 1;

        // Requirement: Update timestamp when button is clicked.
        // Rule: "Except first stage". Stage 1 keeps its initial creation time.
        // For Stage 2, 3, etc., clicking Update sets their completion time.
        if (completedStageId > 1) {
            newState.history[completedStageId] = { date, time };
        }

        // Advance to next stage
        newState.currentStageId = nextStageId;

        // Ensure the new active stage doesn't have a pre-filled timestamp (it's pending)
        // (Unless we want to clear it if it existed? Assuming forward progression, it shouldn't exist or doesn't matter)

        dispatch(setInitialTracking({ key, data: newState }));
    };

    const getTrackingForBuffalo = (orderId: string, buffaloNum: number, initialStatus: string, createdAt?: string) => {
        const key = `${orderId}-${buffaloNum}`;
        if (trackingData[key]) return trackingData[key];

        let dateStr = '24-05-2025';
        let timeStr = '10:30:00';

        if (createdAt) {
            const dateObj = new Date(createdAt);
            if (!isNaN(dateObj.getTime())) {
                const day = String(dateObj.getDate()).padStart(2, '0');
                const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                const year = dateObj.getFullYear();
                dateStr = `${day}-${month}-${year}`;

                const hours = String(dateObj.getHours()).padStart(2, '0');
                const minutes = String(dateObj.getMinutes()).padStart(2, '0');
                const seconds = String(dateObj.getSeconds()).padStart(2, '0');
                timeStr = `${hours}:${minutes}:${seconds}`;
            }
        }

        // Cycle 1 starts at Stage 2 (Payment Pending) automatically
        // Cycle 2 starts at Stage 4 (Order Approved)
        let startStage = 1;

        if (buffaloNum === 1) {
            startStage = 2;
        } else if (buffaloNum === 2) {
            startStage = 4;
        }

        const historyData: any = { 1: { date: dateStr, time: timeStr } };

        if (buffaloNum === 2) {
            // Pre-fill history for previous stages as they are skipped
            historyData[2] = { date: dateStr, time: timeStr };
            historyData[3] = { date: dateStr, time: timeStr };
        }

        return { currentStageId: startStage, history: historyData };
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
                                <th className="tracking-table-th">Order Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ordersLoading ? (
                                <TableSkeleton cols={6} rows={10} />
                            ) : currentItems.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="tracking-no-data-cell">
                                        No approved orders found.
                                    </td>
                                </tr>
                            ) : (
                                currentItems.map((entry: any, index: number) => {
                                    const { order, investor, transaction: tx } = entry;
                                    const unit = order || {};
                                    const absoluteIndex = (currentPage - 1) * itemsPerPage + index;
                                    const isExpanded = expandedOrderId === unit.id;

                                    return (
                                        <React.Fragment key={`${order.id}-${absoluteIndex}`}>
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
                                                    {order.id}
                                                </td>
                                                <td className="tracking-table-td check-status">
                                                    <button
                                                        className="check-status-btn"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
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
                                                    >
                                                        Check Status
                                                    </button>
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr className="tracking-expanded-row">
                                                    <td colSpan={6} className="tracking-expanded-cell">
                                                        <div className="order-expand-animation tracking-expand-container">
                                                            <div className="tracking-interface-container">
                                                                <div className="tracking-units-sidebar">
                                                                    <div className="tracking-units-title">Select Unit</div>
                                                                    <div className="units-sidebar tracking-units-list">
                                                                        {Array.from({ length: Math.ceil(unit.numUnits || 0) }).map((_, i) => {
                                                                            const unitBufCount = (i === Math.floor(unit.numUnits) && (unit.numUnits % 1 !== 0)) ? 1 : 2;
                                                                            return (
                                                                                <button
                                                                                    key={i}
                                                                                    onClick={() => dispatch(setActiveUnitIndex(activeUnitIndex === i ? null : i))}
                                                                                    className={`tracking-unit-btn ${activeUnitIndex === i ? 'active' : 'inactive'}`}
                                                                                >
                                                                                    <span>Unit {i + 1} {unitBufCount === 1 && <span className="tracking-unit-buf-count">(1 Buffalo)</span>}</span>
                                                                                    <span className="tracking-unit-btn-subtitle">{unit.breedId || 'MURRAH-001'}</span>
                                                                                </button>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>

                                                                <div className="tracking-main-content">
                                                                    {activeUnitIndex !== null ? (
                                                                        <div className="order-expand-animation tracking-buffalo-grid">
                                                                            {(() => {
                                                                                const numBuffaloes = (activeUnitIndex === Math.floor(unit.numUnits) && (unit.numUnits % 1 !== 0)) ? 1 : 2;
                                                                                return Array.from({ length: numBuffaloes }).map((_, idx) => {
                                                                                    const buffaloNum = idx + 1;
                                                                                    const tracker = trackingData[`${unit.id}-${buffaloNum}`] || getTrackingForBuffalo(unit.id, buffaloNum, unit.paymentStatus, unit.created_at || unit.createdAt);
                                                                                    const currentStageId = tracker.currentStageId;
                                                                                    const trackerKey = `${unit.id}-${buffaloNum}`;
                                                                                    const isExpanded = !!expandedTrackerKeys[trackerKey];

                                                                                    const allStages = [
                                                                                        { id: 1, label: 'Order Placed' },
                                                                                        { id: 2, label: 'Payment Pending' },
                                                                                        { id: 3, label: 'Order Confirm' },
                                                                                        { id: 4, label: 'Order Approved' },
                                                                                        { id: 5, label: 'Order in Market' },
                                                                                        { id: 6, label: 'Order in Quarantine' },
                                                                                        { id: 7, label: 'In Transit' },
                                                                                        { id: 8, label: 'Order Delivered' }
                                                                                    ];
                                                                                    // For Cycle 2, hide stages 1, 2, 3
                                                                                    const timelineStages = buffaloNum === 2
                                                                                        ? allStages.filter(s => s.id >= 4)
                                                                                        : allStages;

                                                                                    return (
                                                                                        <div key={buffaloNum} className="tracking-buffalo-card">
                                                                                            <div className="tracking-buffalo-title">
                                                                                                <span>cycle-{buffaloNum} </span>
                                                                                                <button
                                                                                                    onClick={() => setExpandedTrackerKeys(prev => ({ ...prev, [trackerKey]: !prev[trackerKey] }))}
                                                                                                    className="tracking-individual-expand-btn"
                                                                                                    style={{ backgroundColor: 'white', border: 'none' }}
                                                                                                >
                                                                                                    {isExpanded ? 'Minimize' : 'Expand'}
                                                                                                    <span className={`tracking-chevron ${isExpanded ? 'up' : 'down'}`}>
                                                                                                        {isExpanded ? '▲' : '▼'}
                                                                                                    </span>
                                                                                                </button>
                                                                                            </div>

                                                                                            {isExpanded && (
                                                                                                <div className="tracking-timeline-container order-expand-animation">
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
                                                                                                                    {stageTime !== '-' && <div className="tracking-timeline-time-sub">{stageTime}</div>}
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
                                                                                                                                onClick={() => handleStageUpdateLocal(unit.id, buffaloNum, stage.id + 1, tracker)}
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
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        );
                                                                                                    })}
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    );
                                                                                });
                                                                            })()}
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
