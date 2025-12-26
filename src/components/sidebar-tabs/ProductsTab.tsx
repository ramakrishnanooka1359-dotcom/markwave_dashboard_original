import React from 'react';
import { useAppSelector } from '../../store/hooks';
import type { RootState } from '../../store';
import ProductImageCarousel from '../products/ProductImageCarousel';
import './ProductsTab.css';

interface ProductsTabProps { }

const ProductsTab: React.FC<ProductsTabProps> = () => {
    const products = useAppSelector((state: RootState) => state.products.products);
    return (
        <div className="products-tab-container">
            <h2>Products</h2>
            <div className="products-grid">
                {products.length === 0 ? (
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
                                        <div className="product-insurance">
                                            Insurance: ₹{product.insurance?.toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ProductsTab;
