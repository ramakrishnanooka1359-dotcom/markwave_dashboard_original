import React, { useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import type { RootState } from '../../store';
import { deleteProduct } from '../../store/slices/productsSlice';
import ProductImageCarousel from '../products/ProductImageCarousel';
import ProductCardSkeleton from '../common/ProductCardSkeleton';
import ProductFormModal from '../modals/ProductFormModal';



import './ProductsTab.css';
import { MoreVertical, Edit, Trash2 } from 'lucide-react';

interface ProductsTabProps { }

const ProductsTab: React.FC<ProductsTabProps> = () => {
    const dispatch = useAppDispatch();
    const { products, loading: productsLoading } = useAppSelector((state: RootState) => state.products);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

    const toggleMenu = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setActiveMenuId(activeMenuId === id ? null : id);
    };

    // Close menu when clicking outside (handled via document click listener if needed, 
    // but for now simple toggle is usually enough or we add a global listener)
    React.useEffect(() => {
        const handleClickOutside = () => setActiveMenuId(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const handleAddProduct = () => {
        setEditingProduct(null);
        setIsModalOpen(true);
    };

    const handleEditProduct = (product: any) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };

    const handleDeleteProduct = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await dispatch(deleteProduct(id)).unwrap();
            } catch (error) {
                console.error('Failed to delete product', error);
            }
        }
    };



    return (
        <div className="products-tab-container">
            <div className="products-tab-header">
                <h2>Products</h2>
                <button className="btn-add-product" onClick={handleAddProduct}>
                    + Add Product
                </button>
            </div>
            <div className="products-grid">
                {productsLoading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                        <ProductCardSkeleton key={i} />
                    ))
                ) : products.length === 0 ? (
                    <div className="products-no-data">
                        No products found
                    </div>
                ) : (
                    products.map((product: any, index: number) => (
                        <div key={product.id || index} className={`product-card ${!product.inStock ? 'product-card-out-of-stock' : ''}`}>
                            {/* Product Image Carousel */}
                            {product.buffalo_images && product.buffalo_images.length > 0 && (
                                <ProductImageCarousel
                                    images={product.buffalo_images}
                                    breed={product.breed}
                                    inStock={product.inStock}
                                />
                            )}

                            {/* Product Details */}
                            <div className="product-details">
                                <div className="product-header">
                                    <h3 className="product-title">
                                        {product.breed}
                                    </h3>
                                    <span className={`product-status-badge ${product.inStock ? 'status-in-stock' : 'status-out-of-stock'}`}>
                                        {product.inStock ? 'In Stock' : 'Out of Stock'}
                                    </span>
                                </div>

                                <div className="product-meta-info">
                                    <div className="product-meta-item">
                                        <strong>Age:</strong> {product.age} years
                                    </div>
                                    <div className="product-meta-item">
                                        <strong>Location:</strong> {product.location}
                                    </div>
                                    <div className="product-meta-item">
                                        <strong>ID:</strong> {product.id}
                                    </div>
                                </div>



                                <p className="product-description">
                                    {product.description}
                                </p>

                                <div className="product-footer">
                                    <div>
                                        <div className="product-price">
                                            ₹{product.price?.toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="product-actions">
                                        <button
                                            className="action-btn menu-btn"
                                            onClick={(e) => toggleMenu(product.id, e)}
                                            title="More Options"
                                        >
                                            <MoreVertical size={18} />
                                        </button>

                                        {activeMenuId === product.id && (
                                            <div className="action-menu-dropdown" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    className="menu-item"
                                                    onClick={() => {
                                                        handleEditProduct(product);
                                                        setActiveMenuId(null);
                                                    }}
                                                >
                                                    <Edit size={16} />
                                                    <span>Edit</span>
                                                </button>
                                                <button
                                                    className="menu-item delete-item"
                                                    onClick={() => {
                                                        handleDeleteProduct(product.id);
                                                        setActiveMenuId(null);
                                                    }}
                                                >
                                                    <Trash2 size={16} />
                                                    <span>Delete</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <ProductFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                product={editingProduct}
            />
        </div>
    );
};

export default ProductsTab;
