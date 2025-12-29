import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import type { RootState } from '../../store';
import { useTableSortAndSearch } from '../../hooks/useTableSortAndSearch';
import { setEditReferralModal } from '../../store/slices/uiSlice';
import Pagination from '../common/Pagination';
import Loader from '../common/Loader';
import './NonVerifiedUsersTab.css';

interface NonVerifiedUsersTabProps {
    getSortIcon: (key: string, currentSortConfig: any) => string;
}

const NonVerifiedUsersTab: React.FC<NonVerifiedUsersTabProps> = ({
    getSortIcon
}) => {
    const dispatch = useAppDispatch();
    const { referralUsers, loading: usersLoading } = useAppSelector((state: RootState) => state.users);

    const [activeSubTab, setActiveSubTab] = useState<'verified' | 'non-verified'>('non-verified');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    // Filter for Admins and then split by verification
    const adminUsers = React.useMemo(() => {
        return referralUsers.filter(user => user.role === 'Admin');
    }, [referralUsers]);

    const verifiedAdmins = React.useMemo(() => adminUsers.filter(user => user.verified), [adminUsers]);
    const nonVerifiedAdmins = React.useMemo(() => adminUsers.filter(user => !user.verified), [adminUsers]);

    const dataToDisplay = activeSubTab === 'verified' ? verifiedAdmins : nonVerifiedAdmins;

    const {
        filteredData: filteredReferrals,
        requestSort: requestReferralSort,
        sortConfig: referralSortConfig
    } = useTableSortAndSearch(dataToDisplay);

    // Reset to page 1 if filtered results change or sub-tab changes
    React.useEffect(() => {
        setCurrentPage(1);
    }, [filteredReferrals.length, activeSubTab]);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredReferrals.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredReferrals.length / itemsPerPage);

    const handleRowClick = (user: any) => {
        dispatch(setEditReferralModal({ isOpen: true, user }));
    };

    return (
        <div className="non-verified-users-container">
            <div className="non-verified-users-header">
                <h2 className="non-verified-users-title">Admin Referrals</h2>
                <div className="admin-sub-tabs">
                    <button
                        className={`sub-tab-btn ${activeSubTab === 'verified' ? 'active' : ''}`}
                        onClick={() => setActiveSubTab('verified')}
                    >
                        Verified Admins ({verifiedAdmins.length})
                    </button>
                    <button
                        className={`sub-tab-btn ${activeSubTab === 'non-verified' ? 'active' : ''}`}
                        onClick={() => setActiveSubTab('non-verified')}
                    >
                        Non-Verified Users ({nonVerifiedAdmins.length})
                    </button>
                </div>
            </div>

            <div className="table-container non-verified-table-container">
                <table className="user-table non-verified-user-table">
                    <thead>
                        <tr>
                            <th className="non-verified-th">S.No</th>
                            <th className="non-verified-th non-verified-th-sortable" onClick={() => requestReferralSort('first_name')}>First Name {getSortIcon('first_name', referralSortConfig)}</th>
                            <th className="non-verified-th non-verified-th-sortable" onClick={() => requestReferralSort('last_name')}>Last Name {getSortIcon('last_name', referralSortConfig)}</th>
                            <th className="non-verified-th non-verified-th-sortable" onClick={() => requestReferralSort('mobile')}>Mobile {getSortIcon('mobile', referralSortConfig)}</th>
                            <th className="non-verified-th non-verified-th-sortable" onClick={() => requestReferralSort('role')}>Role {getSortIcon('role', referralSortConfig)}</th>
                            <th className="non-verified-th non-verified-th-sortable" onClick={() => requestReferralSort('refered_by_name')}>Referred By {getSortIcon('refered_by_name', referralSortConfig)}</th>
                            <th className="non-verified-th non-verified-th-sortable" onClick={() => requestReferralSort('refered_by_mobile')}>Referrer Mobile {getSortIcon('refered_by_mobile', referralSortConfig)}</th>
                            <th className="non-verified-th non-verified-th-sortable" onClick={() => requestReferralSort('verified')}>Verified {getSortIcon('verified', referralSortConfig)}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {usersLoading ? (
                            <tr>
                                <td colSpan={8}>
                                    <Loader />
                                </td>
                            </tr>
                        ) : currentItems.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="non-verified-no-data">No users found</td>
                            </tr>
                        ) : (
                            currentItems.map((user: any, index: number) => (
                                <tr key={index}>
                                    <td className="non-verified-td">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                    <td className="non-verified-td">{user.first_name || '-'}</td>
                                    <td className="non-verified-td">{user.last_name || '-'}</td>
                                    <td className="non-verified-td">{user.mobile}</td>
                                    <td className="non-verified-td">{user.role}</td>
                                    <td className="non-verified-td">{user.refered_by_name || '-'}</td>
                                    <td className="non-verified-td">{user.refered_by_mobile || '-'}</td>
                                    <td className="non-verified-td">
                                        <span className={`status-pill ${user.verified ? 'status-pill-verified' : 'status-pill-non-verified'}`}>
                                            {user.verified ? 'Yes' : 'No'}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
            />
        </div>
    );
};

export default NonVerifiedUsersTab;
