import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { usePersistentPagination } from '../../hooks/usePersistence';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import type { RootState } from '../../store';
import { CheckCircle, CheckSquare, XCircle, Clock, ClipboardList, ChevronDown, Copy, Check } from 'lucide-react';
import {
    setSearchQuery,
    setPaymentFilter,
    setStatusFilter,
} from '../../store/slices/ordersSlice';
import { API_ENDPOINTS } from '../../config/api';
import './OrdersTab.css';
import { setProofModal } from '../../store/slices/uiSlice';

import Pagination from '../common/Pagination';
import Loader from '../common/Loader';

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
    const pendingUnits = useAppSelector((state: RootState) => state.orders.pendingUnits);
    const { error: ordersError, loading: ordersLoading } = useAppSelector((state: RootState) => state.orders);
    const { searchQuery, paymentFilter, statusFilter } = useAppSelector((state: RootState) => state.orders.filters);
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

    // Persist filters to localStorage
    useEffect(() => {
        localStorage.setItem('orders_searchQuery', searchQuery);
        localStorage.setItem('orders_paymentFilter', paymentFilter);
        localStorage.setItem('orders_statusFilter', statusFilter);
    }, [searchQuery, paymentFilter, statusFilter]);

    // Persist expansion state


    // Persist tracking data
    useEffect(() => {
        localStorage.setItem('orders_trackingData', JSON.stringify(trackingData));
    }, [trackingData]);

    // Filter Logic
    const filteredUnits = useMemo(() => {
        return pendingUnits.filter((entry: any) => {
            const unit = entry.order || {};
            const tx = entry.transaction || entry.transation || {};
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
    const [currentPage, setCurrentPage] = usePersistentPagination('orders_currentPage', 1);
    const itemsPerPage = 15;

    // Reset page on filter change
    // Use a ref to track previous filters so we only reset when they ACTUALLY change,
    // not just on mount/re-render.
    const prevFiltersRef = React.useRef({ searchQuery, paymentFilter, statusFilter });

    useEffect(() => {
        const prev = prevFiltersRef.current;
        const current = { searchQuery, paymentFilter, statusFilter };

        // Compare current filters with previous filters
        const isDifferent =
            prev.searchQuery !== current.searchQuery ||
            prev.paymentFilter !== current.paymentFilter ||
            prev.statusFilter !== current.statusFilter;

        if (isDifferent) {
            setCurrentPage(1);
            prevFiltersRef.current = current;
        }
    }, [searchQuery, paymentFilter, statusFilter, setCurrentPage]);

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredUnits.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredUnits.length / itemsPerPage);

    // Ensure we don't stay on a page that no longer exists
    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        }
    }, [totalPages, currentPage, setCurrentPage]);

    const handleViewProof = useCallback((transaction: any, investor: any) => {
        dispatch(setProofModal({ isOpen: true, data: { ...transaction, name: investor.name } }));
    }, [dispatch]);

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
                    placeholder="Search..."
                    className="search-input orders-search"
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                />
            </div>

            {/* New Filter Tabs */}
            {/* Status Cards / Filters */}
            <div className="status-controls">
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


            </div>

            {/* Filter Controls Removed (Search moved to header, Select moved to Table) */}

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
                            {statusFilter === 'PENDING_ADMIN_VERIFICATION' && <th>Actions</th>}
                            {statusFilter === 'REJECTED' && <th>Rejected Reason</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {ordersLoading ? (
                            <tr>
                                <td colSpan={11}>
                                    <Loader />
                                </td>
                            </tr>
                        ) : currentItems.length === 0 ? (
                            <tr>
                                <td colSpan={11} className="no-data-row">
                                    {searchQuery ? 'No matching orders found' : 'No pending orders'}
                                </td>
                            </tr>
                        ) : (
                            currentItems.map((entry: any, index: number) => {
                                const unit = entry.order || {};
                                const tx = entry.transaction || entry.transation || {};
                                const inv = entry.investor || {};
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
                                            <td>{unit.id}</td>
                                            <td>{inv.mobile}</td>
                                            <td>{inv.email || '-'}</td>
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
                                                {unit.paymentType ? (
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
                                            </td>}
                                        </tr>

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
