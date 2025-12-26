import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import type { RootState } from '../../store';
import { CheckCircle, CheckSquare, XCircle, Clock, ClipboardList } from 'lucide-react';
import {
    setSearchQuery,
    setPaymentFilter,
    setStatusFilter,
    setExpandedOrderId,
    setActiveUnitIndex,
    setShowFullDetails,
    updateTrackingData,
} from '../../store/slices/ordersSlice';
import { API_ENDPOINTS } from '../../config/api';
import './OrdersTab.css';
import { setProofModal } from '../../store/slices/uiSlice';
import Pagination from '../common/Pagination';

interface OrdersTabProps {
    handleApproveClick: (unitId: string) => void;
    handleReject: (unitId: string) => void;
}

const OrdersTab: React.FC<OrdersTabProps> = ({
    handleApproveClick,
    handleReject
}) => {
    const dispatch = useAppDispatch();

    // Redux State
    const pendingUnits = useAppSelector((state: RootState) => state.orders.pendingUnits);
    const ordersError = useAppSelector((state: RootState) => state.orders.error);
    const { searchQuery, paymentFilter, statusFilter } = useAppSelector((state: RootState) => state.orders.filters);
    const { expandedOrderId, activeUnitIndex, showFullDetails } = useAppSelector((state: RootState) => state.orders.expansion);
    const trackingData = useAppSelector((state: RootState) => state.orders.trackingData);

    // Debounce Search
    const [localSearch, setLocalSearch] = useState(searchQuery);

    useEffect(() => {
        setLocalSearch(searchQuery);
    }, [searchQuery]);

    useEffect(() => {
        const timer = setTimeout(() => {
            dispatch(setSearchQuery(localSearch));
        }, 300);
        return () => clearTimeout(timer);
    }, [localSearch, dispatch]);

    // Filter Logic
    const filteredUnits = useMemo(() => {
        return pendingUnits.filter((entry: any) => {
            const unit = entry.order || {};
            const tx = entry.transaction || {};
            const inv = entry.investor || {};

            let matchesSearch = true;
            if (searchQuery) {
                const query = searchQuery.toLocaleLowerCase();
                matchesSearch = (
                    (unit.id && String(unit.id).toLocaleLowerCase().includes(query)) ||
                    (unit.userId && String(unit.userId).toLocaleLowerCase().includes(query)) ||
                    (unit.breedId && String(unit.breedId).toLocaleLowerCase().includes(query)) ||
                    (inv.name && String(inv.name).toLocaleLowerCase().includes(query))
                );
            }

            let matchesPayment = true;
            if (paymentFilter !== 'All Payments') {
                matchesPayment = tx.paymentType === paymentFilter;
            }

            let matchesStatus = true;
            if (statusFilter !== 'All Status') {
                const currentStatus = unit.paymentStatus;
                if (statusFilter === 'PAID') {
                    matchesStatus = currentStatus === 'PAID' || currentStatus === 'Approved';
                } else if (statusFilter === 'REJECTED') {
                    matchesStatus = currentStatus === 'REJECTED' || currentStatus === 'Rejected';
                } else {
                    matchesStatus = currentStatus === statusFilter;
                }
            }

            return matchesSearch && matchesPayment && matchesStatus;
        });
    }, [pendingUnits, searchQuery, paymentFilter, statusFilter]);


    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    // Reset page on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, paymentFilter, statusFilter]);

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredUnits.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredUnits.length / itemsPerPage);

    const handleViewProof = useCallback((transaction: any, investor: any) => {
        dispatch(setProofModal({ isOpen: true, data: { ...transaction, name: investor.name } }));
    }, [dispatch]);

    const handleStageUpdateLocal = useCallback((orderId: string, buffaloNum: number, nextStageId: number) => {
        const now = new Date();
        const date = now.toLocaleDateString('en-GB').replace(/\//g, '-');
        const time = now.toLocaleTimeString('en-GB');
        dispatch(updateTrackingData({ key: `${orderId}-${buffaloNum}`, stageId: nextStageId, date, time }));
    }, [dispatch]);

    const getTrackingForBuffalo = useCallback((orderId: string, buffaloNum: number, initialStatus: string) => {
        const key = `${orderId}-${buffaloNum}`;
        if (trackingData[key]) return trackingData[key];
        return { currentStageId: 1, history: { 1: { date: '24-05-2025', time: '10:30:00' } } };
    }, [trackingData]);

    const formatIndiaDate = useCallback((val: any) => {
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
        return val;
    }, []);

    const formatIndiaDateHeader = (val: any) => {
        if (!val || (typeof val !== 'string' && typeof val !== 'number')) return '-';
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
        return val;
    };

    // Calculate Counts
    const counts = {
        needsApproval: pendingUnits.filter((u: any) => u.order?.paymentStatus === 'PENDING_ADMIN_VERIFICATION').length,
        approved: pendingUnits.filter((u: any) => u.order?.paymentStatus === 'Approved' || u.order?.paymentStatus === 'PAID').length,
        rejected: pendingUnits.filter((u: any) => u.order?.paymentStatus === 'Rejected' || u.order?.paymentStatus === 'REJECTED').length,
        notPaid: pendingUnits.filter((u: any) => u.order?.paymentStatus === 'PENDING_PAYMENT').length,
    };



    // ... inside the component ...

    return (
        <div className="orders-dashboard">
            <div className="orders-header">
                <h2>Live Orders</h2>
                <input
                    type="text"
                    placeholder="Search By UserName, OrderId, UserMobile"
                    className="search-input orders-search"
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                />
            </div>

            {/* New Filter Tabs */}
            {/* Status Cards / Filters */}
            <div className="status-controls">
                <div
                    className={`stats-card ${statusFilter === 'PENDING_ADMIN_VERIFICATION' ? 'active-pending' : ''}`}
                    onClick={() => dispatch(setStatusFilter('PENDING_ADMIN_VERIFICATION'))}
                >
                    <div className="card-icon-wrapper pending">
                        <CheckCircle size={24} />
                    </div>
                    <div className="card-content">
                        <h3>{counts.needsApproval}</h3>
                        <p>Admin Approval</p>
                    </div>
                </div>

                <div
                    className={`stats-card ${statusFilter === 'PAID' ? 'active-paid' : ''}`}
                    onClick={() => dispatch(setStatusFilter('PAID'))}
                >
                    <div className="card-icon-wrapper approved">
                        <CheckSquare size={24} />
                    </div>
                    <div className="card-content">
                        <h3>{counts.approved}</h3>
                        <p>Approved</p>
                    </div>
                </div>

                <div
                    className={`stats-card ${statusFilter === 'REJECTED' ? 'active-rejected' : ''}`}
                    onClick={() => dispatch(setStatusFilter('REJECTED'))}
                >
                    <div className="card-icon-wrapper rejected">
                        <XCircle size={24} />
                    </div>
                    <div className="card-content">
                        <h3>{counts.rejected}</h3>
                        <p>Rejected</p>
                    </div>
                </div>

                <div
                    className={`stats-card ${statusFilter === 'PENDING_PAYMENT' ? 'active-payment-due' : ''}`}
                    onClick={() => dispatch(setStatusFilter('PENDING_PAYMENT'))}
                >
                    <div className="card-icon-wrapper payment-due">
                        <Clock size={24} />
                    </div>
                    <div className="card-content">
                        <h3>{counts.notPaid}</h3>
                        <p>Payment Due</p>
                    </div>
                </div>

                <div
                    className={`stats-card ${statusFilter === 'All Status' ? 'active-all' : ''}`}
                    onClick={() => dispatch(setStatusFilter('All Status'))}
                >
                    <div className="card-icon-wrapper all">
                        <ClipboardList size={24} />
                    </div>
                    <div className="card-content">
                        <h3>{pendingUnits.length}</h3>
                        <p>Open Orders</p>
                    </div>
                </div>
            </div>

            {/* Filter Controls Removed (Search moved to header, Select moved to Table) */}

            {
                ordersError && (
                    <div className="orders-error-msg">{ordersError}</div>
                )
            }

            <div className="table-container">
                <table className="user-table">
                    <thead>
                        <tr>
                            <th>S.No</th>
                            <th className="th-user-name">User Name</th>
                            <th>Status</th>
                            <th>Units</th>
                            <th>Order Id</th>
                            <th>User Mobile</th>
                            <th>Email</th>
                            <th>Amount</th>
                            <th>
                                <select
                                    value={paymentFilter}
                                    onChange={(e) => dispatch(setPaymentFilter(e.target.value))}
                                    className="payment-type-select"
                                >
                                    <option value="All Payments">Payment Type</option>
                                    <option value="BANK_TRANSFER">Bank Transfer</option>
                                    <option value="CHEQUE">Cheque</option>
                                    <option value="ONLINE_UPI" disabled>Online/UPI</option>
                                </select>
                            </th>
                            <th className="th-proof">Payment Image Proof</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.length === 0 ? (
                            <tr>
                                <td colSpan={11} className="no-data-row">
                                    {searchQuery ? 'No matching orders found' : 'No pending orders'}
                                </td>
                            </tr>
                        ) : (
                            currentItems.map((entry: any, index: number) => {
                                const unit = entry.order || {};
                                const tx = entry.transaction || {};
                                const inv = entry.investor || {};
                                const isExpanded = expandedOrderId === unit.id;
                                const canExpand = false;
                                const serialNumber = indexOfFirstItem + index + 1;

                                return (
                                    <React.Fragment key={`${unit.id || 'order'}-${index}`}>
                                        <tr>
                                            <td>{serialNumber}</td>
                                            <td>{inv.name}</td>
                                            <td className="td-vertical-middle">
                                                {(() => {
                                                    let statusClass = '';
                                                    let label = unit.paymentStatus || '-';

                                                    if (unit.paymentStatus === 'PENDING_ADMIN_VERIFICATION') {
                                                        statusClass = 'admin-approval';
                                                        label = 'Admin Approval';
                                                    } else if (unit.paymentStatus === 'PAID' || unit.paymentStatus === 'Approved') {
                                                        statusClass = 'paid';
                                                        label = 'Paid';
                                                    } else if (unit.paymentStatus === 'REJECTED') {
                                                        statusClass = 'rejected';
                                                        label = 'Rejected';
                                                    } else if (unit.paymentStatus === 'PENDING_PAYMENT') {
                                                        statusClass = 'payment-due';
                                                        label = 'Payment Due';
                                                    }

                                                    return (
                                                        <span className={`status-badge ${statusClass}`}>
                                                            {label}
                                                        </span>
                                                    );
                                                })()}
                                            </td>
                                            <td>{unit.numUnits}</td>
                                            <td>
                                                <button
                                                    onClick={() => {
                                                        if (!canExpand) return;
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
                                                    className={`expand-order-btn ${canExpand ? 'can-expand' : 'disabled'}`}
                                                >
                                                    {unit.id}
                                                </button>
                                            </td>
                                            <td>{inv.mobile}</td>
                                            <td>{inv.email || '-'}</td>
                                            <td>{tx.amount ?? '-'}</td>
                                            <td>{tx.paymentType || '-'}</td>
                                            <td>
                                                {unit.paymentType ? (
                                                    <button
                                                        className="view-proof-btn"
                                                        onClick={() => handleViewProof(tx, inv)}
                                                    >
                                                        Payment Proof
                                                    </button>
                                                ) : '-'}
                                            </td>
                                            <td>
                                                <div className="action-btn-container">
                                                    {unit.paymentStatus === 'PENDING_ADMIN_VERIFICATION' && (
                                                        <button
                                                            onClick={() => handleApproveClick(unit.id)}
                                                            className="action-btn approve"
                                                        >
                                                            Approve
                                                        </button>
                                                    )}
                                                    {unit.paymentStatus === 'PENDING_ADMIN_VERIFICATION' && (
                                                        <button
                                                            onClick={() => handleReject(unit.id)}
                                                            className="action-btn reject"
                                                        >
                                                            Reject
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                        {isExpanded && canExpand && (
                                            <tr className="expanded-row">
                                                <td colSpan={11} className="expanded-row-content">
                                                    <div className="order-expand-animation expanded-details-container">
                                                        <div className="expanded-top-section">
                                                            <div className="details-card">
                                                                <div className={`details-header ${showFullDetails ? 'border-bottom' : ''}`}>
                                                                    <div className="details-grid">
                                                                        {[
                                                                            { label: 'Payment Method', value: tx.paymentType || '-' },
                                                                            { label: 'Total Amount', value: `₹${tx.amount ?? '-'}` },
                                                                            { label: 'Approval Date', value: formatIndiaDateHeader(unit.updatedAt || unit.updated_at || unit.createdAt || unit.created_at || tx.updatedAt || tx.updated_at || tx.createdAt || tx.created_at || unit.paymentApprovedAt || tx.receipt_date || unit.date || tx.date || unit.approved_at || unit.approvedAt || tx.approved_at || tx.approvedAt || unit.order_date || tx.payment_date) },
                                                                            { label: 'Payment Mode', value: tx.paymentType || 'MANUAL_PAYMENT' },
                                                                            { label: 'Breed ID', value: unit.breedId || 'MURRAH-001' }
                                                                        ].map((item, idx) => (
                                                                            <div key={idx} className="details-item">
                                                                                <div className="details-label">{item.label}</div>
                                                                                <div className="details-value">{item.value}</div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                    <button
                                                                        onClick={() => dispatch(setShowFullDetails(!showFullDetails))}
                                                                        className={`toggle-details-btn ${showFullDetails ? 'open' : 'closed'}`}
                                                                    >
                                                                        ∨
                                                                    </button>
                                                                </div>

                                                                {showFullDetails && (
                                                                    <div className="order-expand-animation extra-details-grid">
                                                                        {(() => {
                                                                            const excludedKeys = ['id', 'name', 'mobile', 'email', 'amount', 'paymentType', 'paymentStatus', 'numUnits', 'order', 'transaction', 'investor', 'password', 'token', 'images', 'cpfUnitCost', 'unitCost', 'base_unit_cost', 'baseUnitCost', 'cpf_unit_cost', 'unit_cost', 'otp', 'first_name', 'last_name', 'otp_verified', 'otp_created_at', 'is_form_filled', 'occupation', 'updatedAt', 'updated_at', 'createdAt', 'created_at', 'breedId', 'breed_id', 'paymentApprovedAt', 'receipt_date', 'date', 'approved_at', 'approvedAt', 'order_date', 'payment_date'];
                                                                            const combinedData = { ...unit, ...tx, ...inv };

                                                                            return Object.entries(combinedData)
                                                                                .filter(([key, value]) => {
                                                                                    const isExcluded = excludedKeys.includes(key);
                                                                                    const lowerKey = key.toLowerCase();
                                                                                    const isUrlKey = lowerKey.includes('url') || lowerKey.includes('link') || lowerKey.includes('proof') || lowerKey.includes('image');
                                                                                    const isUrlValue = typeof value === 'string' && (value.startsWith('http') || value.startsWith('/api/'));
                                                                                    return !isExcluded && !isUrlKey && !isUrlValue && value !== null && value !== undefined && typeof value !== 'object';
                                                                                })
                                                                                .map(([key, value], idx) => (
                                                                                    <div key={`extra-${idx}`} className="details-item">
                                                                                        <div className="details-label">
                                                                                            {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())}
                                                                                        </div>
                                                                                        <div className="details-value">{formatIndiaDate(value)}</div>
                                                                                    </div>
                                                                                ));
                                                                        })()}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="expanded-bottom-section">
                                                            <div className="units-select-sidebar">
                                                                <div className="units-select-title">Select Unit</div>
                                                                <div className="units-list">
                                                                    {Array.from({ length: unit.numUnits || 0 }).map((_, i) => (
                                                                        <button
                                                                            key={i}
                                                                            onClick={() => dispatch(setActiveUnitIndex(activeUnitIndex === i ? null : i))}
                                                                            className={`unit-select-btn ${activeUnitIndex === i ? 'active' : 'inactive'}`}
                                                                        >
                                                                            <span>Unit {i + 1}</span>
                                                                            <span className="unit-breed-id">{unit.breedId || 'MURRAH-001'}</span>
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            <div className="tracking-content">
                                                                {activeUnitIndex !== null ? (
                                                                    <div className="order-expand-animation tracking-grid">
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
                                                                                <div key={buffaloNum} className="tracking-card">
                                                                                    <div className="tracking-card-header">
                                                                                        Buffalo {buffaloNum} Progress
                                                                                    </div>

                                                                                    <div className="timeline-container">
                                                                                        {timelineStages.map((stage, idx) => {
                                                                                            const isLast = idx === timelineStages.length - 1;
                                                                                            const isStepCompleted = stage.id < currentStageId;
                                                                                            const isCurrent = stage.id === currentStageId;
                                                                                            const stageDate = tracker.history[stage.id]?.date || '-';
                                                                                            const stageTime = tracker.history[stage.id]?.time || '-';

                                                                                            return (
                                                                                                <div key={stage.id} className="timeline-item">
                                                                                                    <div className="timeline-date">
                                                                                                        <div className="timeline-date-text">{stageDate}</div>
                                                                                                    </div>

                                                                                                    <div className="timeline-marker-container">
                                                                                                        {!isLast && (
                                                                                                            <div className={`timeline-line ${isStepCompleted ? 'completed' : 'pending'}`} />
                                                                                                        )}
                                                                                                        <div className={`timeline-dot ${isStepCompleted ? 'completed' : isCurrent ? 'current' : 'pending'}`}>
                                                                                                            {isStepCompleted ? '✓' : stage.id}
                                                                                                        </div>
                                                                                                    </div>

                                                                                                    <div className={`timeline-content ${isLast ? '' : 'not-last'}`}>
                                                                                                        <div className="timeline-header">
                                                                                                            <div className={`timeline-label ${isStepCompleted ? 'completed' : isCurrent ? 'current' : 'pending'}`}>
                                                                                                                {stage.label}
                                                                                                            </div>

                                                                                                            {isCurrent && (
                                                                                                                <button
                                                                                                                    className="timeline-update-btn"
                                                                                                                    onClick={() => handleStageUpdateLocal(unit.id, buffaloNum, stage.id + 1)}
                                                                                                                >
                                                                                                                    {stage.id === 8 ? 'Confirm Delivery' : 'Update'}
                                                                                                                </button>
                                                                                                            )}

                                                                                                            {isStepCompleted && (
                                                                                                                <span className="timeline-completed-badge">
                                                                                                                    {stage.id === 8 ? 'Delivered' : 'Completed'}
                                                                                                                </span>
                                                                                                            )}
                                                                                                        </div>
                                                                                                        <div className="timeline-time">
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
                                                                    <div className="no-tracking-placeholder">
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

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
            />
        </div >
    );
};

export default OrdersTab;
