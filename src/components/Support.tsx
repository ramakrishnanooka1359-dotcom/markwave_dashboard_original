import React, { useState } from 'react';
import './Support.css';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FAQ {
    question: string;
    answer: string;
}

const FAQS: FAQ[] = [
    {
        question: "What is the Cattle Protection Fund (CPF)?",
        answer: "The Cattle Protection Fund (CPF) is a mandatory component for every buffalo unit purchase. It ensures the welfare and protection of the livestock. The cost is fixed at ₹26,000 per unit, which includes 2 buffaloes and 2 calves."
    },
    {
        question: "How is my personal data used?",
        answer: "We use your data primarily for account management, transaction verification (especially for manual payments), and to provide investment projections. We respect your privacy and only share data with essential partners like insurance providers."
    },
    {
        question: "How does the referral program work?",
        answer: "When you refer a friend who completes a purchase, you earn 2% of their total purchase amount as Referral Coins. These coins are credited to your account and can be used for future unit purchases."
    },
    {
        question: "Can I withdraw my referral coins as cash?",
        answer: "No, Referral Coins are non-transferable and cannot be withdrawn as cash. However, once you accumulate 363,000 coins, you can use them to purchase a full buffalo unit."
    },
    {
        question: "How long does payment verification take?",
        answer: "For manual payments (Bank Transfer or Cheque), our Admin Team typically completes verification within 3 business days. Once verified, your order status will change from 'Pending' to 'Paid', and you can download your invoice."
    }
];

const FAQItem: React.FC<{ item: FAQ }> = ({ item }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={`faq-item ${isOpen ? 'open' : ''}`} onClick={() => setIsOpen(!isOpen)}>
            <div className="faq-question">
                <span>{item.question}</span>
                {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            <div className={`faq-answer ${isOpen ? 'show' : ''}`}>
                <p>{item.answer}</p>
            </div>
        </div>
    );
};

const Support: React.FC = () => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        message: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Support form submitted:', formData);
        alert('Thank you for contacting support! We will get back to you shortly.');
        // Reset form
        setFormData({
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            message: ''
        });
    };

    return (
        <div className="support-container">
            <div className="support-header">
                <h1>Contact Support</h1>
                <p>We are here to help. Check our FAQs or fill out the form below.</p>
            </div>

            <div className="faq-section">
                <h2>Frequently Asked Questions</h2>
                <div className="faq-list">
                    {FAQS.map((faq, index) => (
                        <FAQItem key={index} item={faq} />
                    ))}
                </div>
            </div>

            <div className="support-form-card">
                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-col">
                            <div className="form-group">
                                <label htmlFor="firstName">First Name</label>
                                <input
                                    type="text"
                                    id="firstName"
                                    name="firstName"
                                    className="form-control"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>
                        <div className="form-col">
                            <div className="form-group">
                                <label htmlFor="lastName">Last Name</label>
                                <input
                                    type="text"
                                    id="lastName"
                                    name="lastName"
                                    className="form-control"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            className="form-control"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="phone">Phone Number</label>
                        <input
                            type="tel"
                            id="phone"
                            name="phone"
                            className="form-control"
                            value={formData.phone}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="message">How can we help you?</label>
                        <textarea
                            id="message"
                            name="message"
                            className="form-control"
                            value={formData.message}
                            onChange={handleChange}
                            placeholder="Describe your issue or question..."
                            required
                        ></textarea>
                    </div>

                    <button type="submit" className="submit-btn">Send Message</button>
                </form>
            </div>
        </div>
    );
};

export default Support;
