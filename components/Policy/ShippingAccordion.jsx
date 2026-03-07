"use client";

import React from 'react';
import Accordion from './Accordion';

const shippingItems = [
  { question: 'What is the shipping charge refund policy?', answer: '' },
  { question: 'What is the delivery time?', answer: '' },
  { question: 'Can I change the delivery address after placing the order?', answer: '' },
  { question: 'Can I pay through bKash after receiving the product?', answer: '' },
  { question: 'Can I get Express Delivery with all the products if I pay an extra Delivery Charge?', answer: '' },
  { question: 'Can I collect a product delivery from your Pickup Point ?', answer: '' },
  { question: 'Does Pickaboo deliver internationally?', answer: '' },
  { question: 'How can I get Delivery Outside Dhaka?', answer: '' },
  { question: 'Can I get Home Delivery Outside Dhaka?', answer: '' },
  { question: 'What is Click & Collect ?', answer: '' },
  { question: 'What is the Delivery Charge?', answer: '' },
  { question: 'What is Express Delivery & How Does it Work?', answer: '' },
  { question: 'What Happens if I Miss the Delivery?', answer: '' },
  { question: 'Can I check the product before making the payment?', answer: '' },
  { question: '90-Minute Delivery: Terms & Conditions', answer: '' },
  { question: 'How does the delivery process work?', answer: 'Once our system processes your order, your products are inspected thoroughly to ensure they are in a perfect condition. After they pass through the final round of quality check, they are packed and handed over to our trusted delivery partner. Our delivery partners then bring the package to you at the earliest possibility. In case, they are unable to reach your provided address or at a suitable time, they will contact you to resolve the issue.' },
  { question: 'How are items packaged?', answer: 'We package our products in cardboard boxes with your invoice wrapped with along with it. Fragile items like bottles are safely secured with additional bubble wrap.' },
  { question: 'What are the delivery charges?', answer: 'Inside and outside Dhaka: 69 BDT for less than 1599 tk purchase. Free delivery over 1599 tk.' },
  { question: 'What is the estimated delivery time?', answer: 'Inside Dhaka and Chittagong: 1-2 working days. Outside Dhaka: 4-5 working days. However, the delivery might be delayed based on political, environmental, transportation, or any other unavoidable issues which will be notified by our customer relationship team.' },
];

export default function ShippingAccordion() {
  return <Accordion items={shippingItems} />;
}
