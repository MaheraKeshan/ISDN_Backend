import nodemailer from "nodemailer";

const sendInvoiceEmail = async (order, user) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: "maherakeshan90@gmail.com",
        pass: "iqmsskqwkwjnwhcf",
      },
    });

    const itemsList = order.products
      .map((item) => {
        // ✅ FIX: Robustly find quantity
        // If order came from DB, it's 'item.quantity'
        // If order object is fresh from frontend payload, it might be 'item.qty'
        const quantity = item.quantity !== undefined ? item.quantity : (item.qty || 0);
        
        // ✅ FIX: Robustly find price and name
        // DB Schema: item.productInfo.name
        // Frontend Payload: item.productInfo might not be fully populated yet if passing raw cart
        // So we check both levels
        const name = item.productInfo?.name || item.name || "Product Name";
        const price = item.productInfo?.price || item.price || 0;
        const total = quantity * price;

        return `<tr>
            <td style="padding: 8px; border: 1px solid #ddd;">${name}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${quantity}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">Rs. ${price}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">Rs. ${total}</td>
          </tr>`;
      })
      .join("");

    const mailOptions = {
      from: `"ISDN Distribution" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `Invoice for Order #${order.orderId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #2563eb; padding: 20px; text-align: center; color: white;">
            <h2 style="margin: 0;">Order Confirmed!</h2>
            <p style="margin: 5px 0 0;">Order ID: ${order.orderId}</p>
          </div>
          
          <div style="padding: 20px;">
            <p>Hi ${user.firstName},</p>
            <p>Thank you for your wholesale order. We are processing it at our Central RDC.</p>
            
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <tr style="background-color: #f8fafc;">
                <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Product</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Qty</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">Unit Price</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">Total</th>
              </tr>
              ${itemsList}
            </table>

            <h3 style="text-align: right; margin-top: 20px; color: #2563eb;">Total: Rs. ${order.total}</h3>
            
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            
            <p style="font-size: 14px; color: #555;">
              <strong>Delivery Address:</strong><br/>
              ${order.address}
            </p>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="http://localhost:5173/track-order" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Track Your Order</a>
            </div>
          </div>
          
          <div style="background-color: #f8fafc; padding: 15px; text-align: center; font-size: 12px; color: #888;">
            <p>© 2026 ISDN Distribution Network. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Invoice email sent to ${user.email}`);
  } catch (error) {
    console.error("Email sending failed:", error);
  }
};

export default sendInvoiceEmail;