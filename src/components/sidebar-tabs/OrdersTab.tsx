import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import type { RootState } from '../../store';
import { CheckCircle, CheckSquare, XCircle, Clock, ClipboardList, Copy, Check } from 'lucide-react';
import {
    setSearchQuery,
    setPaymentFilter,
    setStatusFilter,
    setTransferModeFilter,
    setPage,
    fetchPendingUnits,
    setExpandedOrderId,
    setActiveUnitIndex,
    setInitialTracking
} from '../../store/slices/ordersSlice';
import { setProofModal } from '../../store/slices/uiSlice';
import Pagination from '../common/Pagination';
import './OrdersTab.css';
import TableSkeleton from '../common/TableSkeleton';

const UTRCopyButton: React.FC<{ value: string }> = ({ value }) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (value && value !== '-') {
            navigator.clipboard.writeText(String(value));
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    return (
        <button
            onClick={handleCopy}
            style={{
                border: 'none',
                background: 'transparent',
                padding: 0,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                color: isCopied ? '#2563eb' : '#64748b',
                transition: 'color 0.2s',
            }}
            title={isCopied ? 'Copied!' : 'Copy'}
        >
            {isCopied ? <Check size={14} /> : <Copy size={12} />}
        </button>
    );
};

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
    const {
        pendingUnits,
        loading: ordersLoading,
        error: ordersError,
        totalCount,
        totalAllOrders,
        statusCounts,
        filters,
        trackingData,
        expansion,
        actionLoading
    } = useAppSelector((state: RootState) => state.orders);

    const { expandedOrderId, activeUnitIndex } = expansion;

    const {
        searchQuery,
        paymentTypeFilter,
        statusFilter,
        transferModeFilter,
        page,
        pageSize
    } = filters;

    const adminMobile = useAppSelector((state: RootState) => state.auth.adminMobile || '9999999999');

    const [searchParams, setSearchParams] = useSearchParams();

    // Sync URL Filters to Redux State
    useEffect(() => {
        const pageParam = searchParams.get('page');
        const statusParam = searchParams.get('status');
        const paymentParam = searchParams.get('payment');
        const modeParam = searchParams.get('mode');

        // Page
        const pageNum = pageParam ? parseInt(pageParam, 10) : 1;
        if (!isNaN(pageNum) && pageNum !== page) {
            dispatch(setPage(pageNum));
        }

        // Status
        if (statusParam && statusParam !== statusFilter) {
            dispatch(setStatusFilter(statusParam));
        }

        // Payment Type
        if (paymentParam && paymentParam !== paymentTypeFilter) {
            dispatch(setPaymentFilter(paymentParam));
        } else if (!paymentParam && paymentTypeFilter !== 'All Payments') {
            dispatch(setPaymentFilter('All Payments'));
        }

        // Transfer Mode
        if (modeParam && modeParam !== transferModeFilter) {
            dispatch(setTransferModeFilter(modeParam));
        } else if (!modeParam && transferModeFilter !== 'All Modes') {
            dispatch(setTransferModeFilter('All Modes'));
        }

    }, [searchParams, dispatch, page, statusFilter, paymentTypeFilter, transferModeFilter]);

    // Debounce Search
    const [localSearch, setLocalSearch] = useState(searchQuery);
    const [expandedTrackerKeys, setExpandedTrackerKeys] = useState<Record<string, boolean>>({}); // NEW: Local state for individual expand/collapse

    // Local state to track which specific order action is processing
    const [processingAction, setProcessingAction] = useState<{ id: string; type: 'approve' | 'reject' } | null>(null);

    const handleApproveWrapper = async (id: string) => {
        setProcessingAction({ id, type: 'approve' });
        try {
            await handleApproveClick(id);
        } finally {
            setProcessingAction(null);
        }
    };

    const handleRejectWrapper = async (id: string) => {
        setProcessingAction({ id, type: 'reject' });
        try {
            await handleReject(id);
        } finally {
            setProcessingAction(null);
        }
    };

    useEffect(() => {
        setLocalSearch(searchQuery);
    }, [searchQuery]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (localSearch !== searchQuery) {
                dispatch(setSearchQuery(localSearch));
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [localSearch, dispatch, searchQuery]);

    // Persist filters to localStorage
    useEffect(() => {
        localStorage.setItem('orders_searchQuery', searchQuery);
        localStorage.setItem('orders_paymentFilter', paymentTypeFilter);
        localStorage.setItem('orders_paymentTypeFilter', paymentTypeFilter);
        localStorage.setItem('orders_statusFilter', statusFilter);
        localStorage.setItem('orders_transferModeFilter', transferModeFilter);
        localStorage.setItem('orders_page', String(page));
    }, [searchQuery, paymentTypeFilter, statusFilter, transferModeFilter, page]);

    // Fetch Data on Filter Change
    useEffect(() => {
        dispatch(fetchPendingUnits({
            adminMobile,
            page,
            pageSize,
            paymentStatus: statusFilter,
            paymentType: paymentTypeFilter,
            transferMode: transferModeFilter,
            search: searchQuery
        }));
    }, [dispatch, adminMobile, page, pageSize, statusFilter, paymentTypeFilter, transferModeFilter, searchQuery]);

    // Reset Page on Filter Change
    const prevFiltersRef = useRef({ statusFilter, paymentTypeFilter, transferModeFilter });
    useEffect(() => {
        const prev = prevFiltersRef.current;
        const current = { statusFilter, paymentTypeFilter, transferModeFilter };

        if (
            prev.statusFilter !== current.statusFilter ||
            prev.paymentTypeFilter !== current.paymentTypeFilter ||
            prev.transferModeFilter !== current.transferModeFilter
        ) {
            // dispatch(setPage(1)); // Handled via URL update now to keep sync
            setSearchParams(prevParams => {
                const newParams = new URLSearchParams(prevParams);
                newParams.set('page', '1');
                return newParams;
            });
            prevFiltersRef.current = current;
        }
    }, [statusFilter, paymentTypeFilter, transferModeFilter, dispatch, setSearchParams]);

    // Initial Stats Fetch
    // Filter Change Handlers with URL updates
    const handleStatusFilterChange = (status: string) => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            newParams.set('status', status); // Always set status explicitly
            newParams.set('page', '1'); // Reset page on filter change
            return newParams;
        });
        // Dispatch happens in useEffect
    };

    const handlePaymentTypeChange = (type: string) => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            if (type === 'All Payments') newParams.delete('payment');
            else newParams.set('payment', type);
            newParams.set('page', '1');
            return newParams;
        });
    };




    const handleViewProof = useCallback((transaction: any, investor: any) => {
        dispatch(setProofModal({ isOpen: true, data: { ...transaction, name: investor.name } }));
    }, [dispatch]);

    const handleToggleExpansion = useCallback((orderId: string) => {
        if (expandedOrderId === orderId) {
            dispatch(setExpandedOrderId(null));
            dispatch(setActiveUnitIndex(null));
        } else {
            dispatch(setExpandedOrderId(orderId));
            dispatch(setActiveUnitIndex(0));
        }
    }, [dispatch, expandedOrderId]);

    // Tracking Helper Functions
    const getTrackingForBuffalo = useCallback((orderId: string, buffaloNum: number, initialStatus: string, createdAt?: string) => {
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

        let startStage = 1;
        if (buffaloNum === 1) startStage = 2;
        else if (buffaloNum === 2) startStage = 4;

        const historyData: any = { 1: { date: dateStr, time: timeStr } };
        if (buffaloNum === 2) {
            historyData[2] = { date: dateStr, time: timeStr };
            historyData[3] = { date: dateStr, time: timeStr };
        }

        return { currentStageId: startStage, history: historyData };
    }, [trackingData]);

    const handleStageUpdateLocal = (orderId: string, buffaloNum: number, nextStageId: number, currentTrackerState?: any) => {
        const key = `${orderId}-${buffaloNum}`;
        const now = new Date();
        const date = now.toLocaleDateString('en-GB').replace(/\//g, '-');
        const time = now.toLocaleTimeString('en-GB');

        let newState;
        if (trackingData[key]) {
            newState = JSON.parse(JSON.stringify(trackingData[key]));
        } else if (currentTrackerState) {
            newState = JSON.parse(JSON.stringify(currentTrackerState));
        } else {
            return;
        }

        const completedStageId = nextStageId - 1;
        if (completedStageId > 1) {
            newState.history[completedStageId] = { date, time };
        }
        newState.currentStageId = nextStageId;

        dispatch(setInitialTracking({ key, data: newState }));
    };

    const trackingStages = [
        { id: 1, label: 'Order Placed' },
        { id: 2, label: 'Payment Pending' },
        { id: 3, label: 'Order Confirm' },
        { id: 4, label: 'Order Approved' },
        { id: 5, label: 'Order in Market' },
        { id: 6, label: 'Order in Quarantine' },
        { id: 7, label: 'In Transit' },
        { id: 8, label: 'Order Delivered' }
    ];

    // Pagination
    const totalPages = Math.ceil((totalCount || 0) / pageSize);

    const currentCols = (statusFilter === 'PENDING_ADMIN_VERIFICATION' || statusFilter === 'REJECTED') ? 11 : 10;

    return (
        <div className="orders-dashboard">
            <div className="orders-header flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                <h2 className="text-xl font-bold">Live Orders</h2>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <input
                        type="date"
                        className="search-input w-full sm:w-auto"
                        style={{ maxWidth: '160px' }}
                    />
                    <input
                        type="text"
                        placeholder="Search by Order ID, Name, Mobile..."
                        className="search-input orders-search w-full sm:w-auto"
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Status Cards / Filters */}
            <div className="status-controls grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                <div
                    className={`stats-card ${statusFilter === 'All Status' ? 'active-all' : ''}`}
                    onClick={() => handleStatusFilterChange('All Status')}
                >
                    <div className="card-icon-wrapper all">
                        <ClipboardList size={24} />
                    </div>
                    <div className="card-content">
                        <h3>{statusFilter === 'All Status' ? totalAllOrders : (statusCounts['All Status'] ?? (totalAllOrders > 0 ? totalAllOrders : '-'))}</h3>
                        <p>All Status</p>
                    </div>
                </div>
                <div
                    className={`stats-card ${statusFilter === 'PENDING_ADMIN_VERIFICATION' ? 'active-pending' : ''}`}
                    onClick={() => handleStatusFilterChange('PENDING_ADMIN_VERIFICATION')}
                >
                    <div className="card-icon-wrapper pending">
                        <CheckCircle size={24} />
                    </div>
                    <div className="card-content">
                        <h3>{statusFilter === 'PENDING_ADMIN_VERIFICATION' ? totalCount : (statusCounts['PENDING_ADMIN_VERIFICATION'] ?? '-')}</h3>
                        <p>Admin Approval</p>
                    </div>
                </div>

                <div
                    className={`stats-card ${statusFilter === 'PAID' ? 'active-paid' : ''}`}
                    onClick={() => handleStatusFilterChange('PAID')}
                >
                    <div className="card-icon-wrapper approved">
                        <CheckSquare size={24} />
                    </div>
                    <div className="card-content">
                        <h3>{statusFilter === 'PAID' ? totalCount : (statusCounts['PAID'] ?? '-')}</h3>
                        <p>Approved/Paid</p>
                    </div>
                </div>

                <div
                    className={`stats-card ${statusFilter === 'REJECTED' ? 'active-rejected' : ''}`}
                    onClick={() => handleStatusFilterChange('REJECTED')}
                >
                    <div className="card-icon-wrapper rejected">
                        <XCircle size={24} />
                    </div>
                    <div className="card-content">
                        <h3>{statusFilter === 'REJECTED' ? totalCount : (statusCounts['REJECTED'] ?? '-')}</h3>
                        <p>Rejected</p>
                    </div>
                </div>

                <div
                    className={`stats-card ${statusFilter === 'PENDING_PAYMENT' ? 'active-payment-due' : ''}`}
                    onClick={() => handleStatusFilterChange('PENDING_PAYMENT')}
                >
                    <div className="card-icon-wrapper payment-due">
                        <Clock size={24} />
                    </div>
                    <div className="card-content">
                        <h3>{statusFilter === 'PENDING_PAYMENT' ? totalCount : (statusCounts['PENDING_PAYMENT'] ?? '-')}</h3>
                        <p>Payment Due</p>
                    </div>
                </div>
            </div>

            {/* Filters Bar Removed - Payment Filter moved to table header */}

            {
                ordersError && (
                    <div className="orders-error-msg">{ordersError}</div>
                )
            }

            <div className="table-container">
                <table className="user-table">
                    <thead style={{ backgroundColor: '#f0f2f5' }}>
                        <tr>
                            <th>S.No</th>
                            <th className="th-user-name">User Name</th>
                            <th>Status</th>
                            <th>Units</th>
                            <th>Order Id</th>
                            <th>User Mobile</th>

                            <th>Email</th>
                            <th>Ordered Date</th>
                            <th>Amount</th>
                            <th style={{ minWidth: '140px' }}>
                                <select
                                    value={paymentTypeFilter}
                                    onChange={(e) => handlePaymentTypeChange(e.target.value)}
                                    className="payment-type-select"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <option value="All Payments">Payment Type</option>
                                    <option value="BANK_TRANSFER">Bank Transfer</option>
                                    <option value="CHEQUE">Cheque</option>
                                    <option value="ONLINE">Online/UPI</option>
                                    <option value="CASH">Cash</option>
                                </select>
                            </th>
                            <th className="th-proof">Payment Image Proof</th>
                            {statusFilter === 'PENDING_ADMIN_VERIFICATION' && <th>Actions</th>}
                            {statusFilter === 'REJECTED' && <th>Rejected Reason</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {ordersLoading ? (
                            <TableSkeleton cols={currentCols} rows={10} />
                        ) : pendingUnits.length === 0 ? (
                            <tr>
                                <td colSpan={currentCols} className="no-data-row">
                                    No orders found matching filters.
                                </td>
                            </tr>
                        ) : (
                            pendingUnits.map((entry: any, index: number) => {
                                const unit = entry.order || {};
                                const tx = entry.transaction || {};
                                const inv = entry.investor || {};
                                const serialNumber = (page - 1) * pageSize + index + 1;

                                const isExpandable = unit.paymentStatus === 'PAID' || unit.paymentStatus === 'Approved';

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
                                                    className="check-status-btn"
                                                    onClick={() => isExpandable && handleToggleExpansion(unit.id)}
                                                    style={{
                                                        fontWeight: 700,
                                                        cursor: isExpandable ? 'pointer' : 'default',
                                                        textDecoration: isExpandable ? 'underline' : 'none',
                                                        color: isExpandable ? '#3b82f6' : '#374151'
                                                    }}
                                                >
                                                    {unit.id}
                                                </button>
                                            </td>
                                            <td>{inv.mobile}</td>
                                            <td>{inv.email || '-'}</td>
                                            <td>
                                                {unit.placedAt ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', fontSize: '12px', fontWeight: 'bold' }}>
                                                        <span >
                                                            {new Date(unit.placedAt).toLocaleDateString('en-GB')}
                                                        </span>
                                                        <span style={{ color: '#64748b', fontSize: '11px' }}>
                                                            {new Date(unit.placedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                                        </span>
                                                    </div>
                                                ) : '-'}
                                            </td>
                                            <td>{tx.amount ?? '-'}</td>
                                            <td className="payment-type-cell">
                                                {tx.paymentType === 'BANK_TRANSFER' || tx.paymentType === 'CHEQUE' ? (
                                                    <div className="bank-transfer-hover-container">
                                                        <span>{tx.paymentType === 'BANK_TRANSFER' ? 'Bank Transfer' : 'Cheque'}</span>
                                                        <div className="bank-details-tooltip">
                                                            <div className="tooltip-title">Payment Details</div>
                                                            {(() => {
                                                                const findVal = (obj: any, keys: string[], partials: string[]) => {
                                                                    if (!obj) return '-';
                                                                    for (const k of keys) {
                                                                        if (obj[k]) return obj[k];
                                                                    }
                                                                    const foundKey = Object.keys(obj).find(k =>
                                                                        partials.some(p => k.toLowerCase().includes(p))
                                                                    );
                                                                    return foundKey ? obj[foundKey] : '-';
                                                                };

                                                                const isCheque = tx.paymentType === 'CHEQUE';

                                                                return (
                                                                    <>
                                                                        <div className="tooltip-item">
                                                                            <span className="tooltip-label">Bank Name:</span>
                                                                            <span className="tooltip-value">{findVal(tx, ['bank_name', 'bankName', 'bank_details'], ['bank'])}</span>
                                                                        </div>
                                                                        <div className="tooltip-item">
                                                                            <span className="tooltip-label">{isCheque ? 'Cheque No:' : 'A/C Number:'}</span>
                                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                                                                                <span className="tooltip-value">
                                                                                    {isCheque
                                                                                        ? findVal(tx, ['cheque_no', 'cheque_number', 'chequeNo'], ['cheque'])
                                                                                        : findVal(tx, ['account_number', 'account_no', 'acc_no', 'ac_no', 'accountNumber'], ['account', 'acc_no', 'ac_no'])
                                                                                    }
                                                                                </span>
                                                                                {isCheque && (
                                                                                    <UTRCopyButton value={findVal(tx, ['cheque_no', 'cheque_number', 'chequeNo'], ['cheque'])} />
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        <div className="tooltip-item">
                                                                            <span className="tooltip-label">{isCheque ? 'Cheque Date:' : 'UTR:'}</span>
                                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                                                                                <span className="tooltip-value">
                                                                                    {isCheque
                                                                                        ? findVal(tx, ['cheque_date', 'date'], ['date'])
                                                                                        : findVal(tx, ['utr', 'utr_no', 'utr_number', 'transaction_id'], ['utr', 'txid'])
                                                                                    }
                                                                                </span>
                                                                                {!isCheque && (
                                                                                    <UTRCopyButton value={findVal(tx, ['utr', 'utr_no', 'utr_number', 'transaction_id'], ['utr', 'txid'])} />
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        {!isCheque && (
                                                                            <div className="tooltip-item">
                                                                                <span className="tooltip-label">IFSC:</span>
                                                                                <span className="tooltip-value">{findVal(tx, ['ifsc_code', 'ifsc', 'ifscCode'], ['ifsc'])}</span>
                                                                            </div>
                                                                        )}
                                                                        {tx.transferMode && (
                                                                            <div className="tooltip-item">
                                                                                <span className="tooltip-label">Mode:</span>
                                                                                <span className="tooltip-value">{tx.transferMode}</span>
                                                                            </div>
                                                                        )}
                                                                    </>
                                                                );
                                                            })()}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    tx.paymentType || '-'
                                                )}
                                            </td>
                                            <td>
                                                {tx.paymentType ? (
                                                    <button
                                                        className="view-proof-btn"
                                                        onClick={() => handleViewProof(tx, inv)}
                                                    >
                                                        Payment Proof
                                                    </button>
                                                ) : '-'}
                                            </td>
                                            {statusFilter === 'REJECTED' && <td>
                                                {unit.rejectedReason || 'No reason provided'}
                                            </td>}
                                            {statusFilter === 'PENDING_ADMIN_VERIFICATION' && <td>
                                                <div className="action-btn-container">
                                                    {unit.paymentStatus === 'PENDING_ADMIN_VERIFICATION' && (
                                                        <button
                                                            onClick={() => handleApproveWrapper(unit.id)}
                                                            className={`action-btn approve ${processingAction?.id === unit.id && processingAction?.type === 'approve' ? 'loading' : ''}`}
                                                            disabled={actionLoading || processingAction !== null}
                                                        >
                                                            {processingAction?.id === unit.id && processingAction?.type === 'approve' ? 'Processing...' : 'Approve'}
                                                        </button>
                                                    )}
                                                    {unit.paymentStatus === 'PENDING_ADMIN_VERIFICATION' && (
                                                        <button
                                                            onClick={() => handleRejectWrapper(unit.id)}
                                                            className={`action-btn reject ${processingAction?.id === unit.id && processingAction?.type === 'reject' ? 'loading' : ''}`}
                                                            disabled={actionLoading || processingAction !== null}
                                                        >
                                                            {processingAction?.id === unit.id && processingAction?.type === 'reject' ? 'Processing...' : 'Reject'}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>}
                                        </tr>

                                        {expandedOrderId === unit.id && (
                                            <tr className="tracking-expanded-row">
                                                <td colSpan={currentCols} className="tracking-expanded-cell">
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
                                                                                // Default to expanded if not set, or handle logic
                                                                                const isExpanded = expandedTrackerKeys[trackerKey] !== false; // Default true or false? Let's default true for Orders for better visibility? Or false to save space?
                                                                                // TrackingTab defaults to false (undefined -> false).
                                                                                // Let's match TrackingTab behavior: undefined -> false.
                                                                                // Wait, let's check TrackingTab again: ` !!expandedTrackerKeys[trackerKey]` -> false by default.
                                                                                // User said "all tabs... should be expand and minimize".
                                                                                // If I default to false, they won't see it immediately.
                                                                                // Let's default to TRUE for OrdersTab as it was visibly open before.
                                                                                // Use: `expandedTrackerKeys[trackerKey] !== false` which means default is TRUE.

                                                                                // For Cycle 2, hide stages 1, 2, 3
                                                                                const timelineStages = buffaloNum === 2
                                                                                    ? trackingStages.filter(s => s.id >= 4)
                                                                                    : trackingStages;

                                                                                return (
                                                                                    <div key={buffaloNum} className="tracking-buffalo-card">
                                                                                        <div className="tracking-buffalo-title">
                                                                                            <span>Cycle-{buffaloNum}</span>
                                                                                            <div className="header-actions">
                                                                                                <button
                                                                                                    onClick={() => setExpandedTrackerKeys(prev => ({ ...prev, [trackerKey]: !isExpanded }))}
                                                                                                    className="tracking-individual-expand-btn"
                                                                                                >
                                                                                                    {isExpanded ? 'Minimize' : 'Expand'}
                                                                                                    <span className={`tracking-chevron ${isExpanded ? 'up' : 'down'}`}>
                                                                                                        {isExpanded ? '▲' : '▼'}
                                                                                                    </span>
                                                                                                </button>
                                                                                            </div>
                                                                                        </div>

                                                                                        {isExpanded && (
                                                                                            <div className="tracking-timeline-container order-expand-animation">
                                                                                                {timelineStages.map((stage, sIdx) => {
                                                                                                    const isLast = sIdx === timelineStages.length - 1;
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

            <Pagination
                currentPage={page}
                totalPages={totalPages || 1}
                onPageChange={(p) => {
                    setSearchParams(prevParams => {
                        const newParams = new URLSearchParams(prevParams);
                        newParams.set('page', String(p));
                        return newParams;
                    });
                }}
            />
        </div>
    );
};

export default OrdersTab;
