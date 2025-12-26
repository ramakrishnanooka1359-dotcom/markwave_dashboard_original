import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import type { RootState } from '../../store';
import { useTableSortAndSearch } from '../../hooks/useTableSortAndSearch';
import { setEditReferralModal } from '../../store/slices/uiSlice';
import Pagination from '../common/Pagination';
import './NonVerifiedUsersTab.css';

interface NonVerifiedUsersTabProps {
    getSortIcon: (key: string, currentSortConfig: any) => string;
}

const NonVerifiedUsersTab: React.FC<NonVerifiedUsersTabProps> = ({
    getSortIcon
}) => {
    const dispatch = useAppDispatch();
    const referralUsers = useAppSelector((state: RootState) => state.users.referralUsers);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    const {
        filteredData: filteredReferrals,
        requestSort: requestReferralSort,
        sortConfig: referralSortConfig
    } = useTableSortAndSearch(referralUsers);

    // Reset to page 1 if filtered results change (e.g. search)
    // Note: useTableSortAndSearch internal filteredData reference changes on filter updates
    React.useEffect(() => {
        setCurrentPage(1);
    }, [filteredReferrals.length]);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredReferrals.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredReferrals.length / itemsPerPage);

    const handleRowClick = (user: any) => {
        dispatch(setEditReferralModal({ isOpen: true, user }));
    };
    return (
        <div className="non-verified-users-container">
            <h2 className="non-verified-users-title">User Referrals</h2>

            <div className="table-container non-verified-table-container">
                <table className="user-table non-verified-user-table">
                    <thead>
                        <tr>
                            <th className="non-verified-th">S.No</th>
                            <th className="non-verified-th non-verified-th-sortable" onClick={() => requestReferralSort('first_name')}>First Name {getSortIcon('first_name', referralSortConfig)}</th>
                            <th className="non-verified-th non-verified-th-sortable" onClick={() => requestReferralSort('last_name')}>Last Name {getSortIcon('last_name', referralSortConfig)}</th>
                            <th className="non-verified-th non-verified-th-sortable" onClick={() => requestReferralSort('mobile')}>Mobile {getSortIcon('mobile', referralSortConfig)}</th>
                            <th className="non-verified-th non-verified-th-sortable" onClick={() => requestReferralSort('refered_by_name')}>Referred By {getSortIcon('refered_by_name', referralSortConfig)}</th>
                            <th className="non-verified-th non-verified-th-sortable" onClick={() => requestReferralSort('refered_by_mobile')}>Referrer Mobile {getSortIcon('refered_by_mobile', referralSortConfig)}</th>
                            <th className="non-verified-th non-verified-th-sortable" onClick={() => requestReferralSort('verified')}>Verified {getSortIcon('verified', referralSortConfig)}</th>
                            <th className="non-verified-th">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.length === 0 ? (
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
                                    <td className="non-verified-td">{user.refered_by_name || '-'}</td>
                                    <td className="non-verified-td">{user.refered_by_mobile || '-'}</td>
                                    <td className="non-verified-td">{user.verified ? 'Yes' : 'No'}</td>
                                    <td className="non-verified-td">
                                        <button
                                            onClick={() => handleRowClick(user)}
                                            className="non-verified-edit-btn"
                                        >
                                            Edit
                                        </button>
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
