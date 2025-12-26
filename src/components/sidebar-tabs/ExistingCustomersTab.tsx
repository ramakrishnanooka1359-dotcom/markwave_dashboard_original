import React, { useState } from 'react';
import { useAppSelector } from '../../store/hooks';
import type { RootState } from '../../store';
import { useTableSortAndSearch } from '../../hooks/useTableSortAndSearch';
import Pagination from '../common/Pagination';
import './ExistingCustomersTab.css';

interface ExistingCustomersTabProps {
    getSortIcon: (key: string, currentSortConfig: any) => string;
}

const ExistingCustomersTab: React.FC<ExistingCustomersTabProps> = ({
    getSortIcon
}) => {
    const existingCustomers = useAppSelector((state: RootState) => state.users.existingCustomers);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    const {
        filteredData: filteredExistingUsers,
        requestSort: requestExistingUsersSort,
        sortConfig: existingUsersSortConfig
    } = useTableSortAndSearch(existingCustomers);

    // Reset to page 1 if filtered results change
    React.useEffect(() => {
        setCurrentPage(1);
    }, [filteredExistingUsers.length]);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredExistingUsers.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredExistingUsers.length / itemsPerPage);

    return (
        <div className="existing-customers-container">
            <h2 className="existing-customers-title">Investors</h2>

            <div className="table-container existing-customers-table-container">
                <table className="user-table existing-customers-table">
                    <thead>
                        <tr>
                            <th className="existing-customers-th">S.No</th>
                            <th className="existing-customers-th existing-customers-th-sortable" onClick={() => requestExistingUsersSort('first_name')}>First Name {getSortIcon('first_name', existingUsersSortConfig)}</th>
                            <th className="existing-customers-th existing-customers-th-sortable" onClick={() => requestExistingUsersSort('last_name')}>Last Name {getSortIcon('last_name', existingUsersSortConfig)}</th>
                            <th className="existing-customers-th existing-customers-th-sortable" onClick={() => requestExistingUsersSort('mobile')}>Mobile {getSortIcon('mobile', existingUsersSortConfig)}</th>
                            <th className="existing-customers-th existing-customers-th-sortable" onClick={() => requestExistingUsersSort('isFormFilled')}>Form Filled {getSortIcon('isFormFilled', existingUsersSortConfig)}</th>
                            <th className="existing-customers-th existing-customers-th-sortable" onClick={() => requestExistingUsersSort('refered_by_name')}>Referred By {getSortIcon('refered_by_name', existingUsersSortConfig)}</th>
                            <th className="existing-customers-th existing-customers-th-sortable" onClick={() => requestExistingUsersSort('refered_by_mobile')}>Referrer Mobile {getSortIcon('refered_by_mobile', existingUsersSortConfig)}</th>
                            <th className="existing-customers-th existing-customers-th-sortable" onClick={() => requestExistingUsersSort('verified')}>Verified {getSortIcon('verified', existingUsersSortConfig)}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="existing-customers-no-data">No users found</td>
                            </tr>
                        ) : (
                            currentItems.map((user: any, index: number) => (
                                <tr key={index}>
                                    <td className="existing-customers-td">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                    <td className="existing-customers-td">{user.first_name || '-'}</td>
                                    <td className="existing-customers-td">{user.last_name || '-'}</td>
                                    <td className="existing-customers-td">{user.mobile}</td>
                                    <td className="existing-customers-td">{user.isFormFilled ? 'Yes' : 'No'}</td>
                                    <td className="existing-customers-td">{user.refered_by_name || '-'}</td>
                                    <td className="existing-customers-td">{user.refered_by_mobile || '-'}</td>
                                    <td className="existing-customers-td">{user.verified ? 'Yes' : 'No'}</td>
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

export default ExistingCustomersTab;
