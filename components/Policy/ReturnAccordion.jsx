"use client";

import Accordion from './Accordion';

const returnItems = [
  { question: 'If your returned product is not validated for return, how are you informed?', answer: '' },
  { question: 'How many times will you attempt to pick my returned item?', answer: '' },
  { question: 'What are the conditions of return?', answer: '' },
  { question: 'How to make a product return & what do I need?', answer: '' },
  { question: 'Once your product is received by Pickaboo.com, what are the checks being done?', answer: '' },
  { question: 'How long Pickaboo will keep the Return/Servicing product?', answer: '' },
  { question: 'How to send your product to Pickaboo.com? How much will it cost you?', answer: '' },
  { question: 'How long pickaboo will take to return my product?', answer: '' },
  { question: 'How do I request for a return ?', answer: '' },
  { question: 'When I can return the product?', answer: '' },
  { question: 'Where to return the product?', answer: '' },
  { question: 'What are the conditions for returning a product?', answer: 'Returns - Refunds\nWe guarantee your satisfaction with all the platforms of KIREI. If you receive a damaged or defective item, wrong product, we will promptly send you a replacement or issue a full refund within 7-10 working days. You will not be charged any additional shipping fees for replacement of such damaged or defective shipments. Please see our Cancellation & Return Policy for more information.' },
  { question: 'Return & Refund Policy', answer: 'If you receive a damaged, defective or wrong product, please return it to Kireibd.com and we\'ll arrange for a replacement provided that meets the following conditions:\n• If any defect is found (damaged/ defective/ wrong product) after opening the box, inform the "Customer Care Department" (through inbox or hotline 01779991110) as soon as possible along with a picture/ video proof.\n• The "Customer Care Department" upon consultation with the management will change/ replace the product or adjust the payment. The complaint will be valid for 3 days from the day the product has been received.\n• Used/ Swatched or liquid/ semi-liquid products will not be considered for exchange or refund.\n• Products once purchased will not be exchanged or returned if the buyer changes his/her purchase decision/ mind, and/ or does not like the smell, texture, color, design, or/ and product.\n• The Return Policy will not be valid after the seal is broken or if the product does not suit you.\n• If you mistakenly order the wrong product, we may exchange it upon payment of returning and resending costs. However, the arrangement of this special exchange depends on the product type and risk involved in the exchange process and also on Management discretion.\n• Original Invoice, Kirei Box, and Product Packaging Box (where applicable) must be returned along with the product.' },
  { question: 'How to send your product back to us? How much will it cost you?', answer: 'Our Customer service will arrange for pick-up of the product from your address, free of delivery charge (*Conditions applied). If you live outside Dhaka, please send your product by Sundarban Courier Service. If your return claim is validated, we will reimburse your courier charge. If we find your claim is not valid regarding the product, then you have to accept the same Product and have to bear the return and resending expenses. For further support: Hotline 01779991110\n\nকাস্টমারদের সন্তুষ্টি ও ভরসাই আমাদের প্রথম প্রায়োরিটি। কিরেই থেকে আপনি যদি ত্রুটিপূর্ণ বা ভুল পণ্য পেয়ে থাকেন, সেটা আমাদের কাছে পাঠানোর পর অবশ্যই আমরা ৭-১০ দিনের মধ্যে রিপ্লেসন্ট বা ফুল রিফান্ডের ব্যবস্থা করে থাকি। আর এই ধরনের ত্রুটিযুক্ত পণ্যের রিপ্লেসমেন্টের জন্য আপনার অতিরিক্ত শিপিং চার্জ লাগবে না। বিস্তারিত জানতে রিটার্ন ও রিফান্ড পলিসি দেখে নিন।\n\nরিটার্ন এবং রিফান্ড পলিসি... [rest of Bangla text]' },
];

export default function ReturnAccordion() {
  return <Accordion items={returnItems} />;
}
