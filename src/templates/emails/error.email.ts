const errorTemplate = `
<mjml>
  <mj-head>
    <mj-title>Server Error Notification | hono</mj-title>
    <mj-font name="Satoshi" href="https://api.fontshare.com/v2/css?f[]=satoshi@900,700,500,400&display=swap" />
    <mj-attributes>
      <mj-all font-family="Satoshi, Arial, sans-serif" padding="0" />
      <mj-text font-size="14px" color="#333333" line-height="24px" padding="10px 25px" />
      <mj-section padding="20px 0" />
      <mj-column padding="0" />
    </mj-attributes>
    <mj-style>
      .footer-link { color: #666666; text-decoration: none; }
      .text-highlight { color: #020c14; font-weight: 600; }
      .stack-trace { 
        background-color: #f8f8f8;
        border-radius: 4px;
        padding: 15px;
        white-space: pre-wrap;
        font-family: 'Courier New', Courier, monospace;
      }
      .request-details {
        background-color: #f8f8f8;
        border-radius: 4px;
        padding: 15px;
      }
      @media (max-width: 480px) {
        .mobile-padding { padding: 10px 15px !important; }
        .mobile-header { padding: 10px 0 !important; }
      }
    </mj-style>
  </mj-head>
  <mj-body background-color="#f4f4f4">
    <mj-section padding="40px 0" background-color="#020c14" css-class="mobile-header">
      <mj-column>
        <mj-image src="https://res.cloudinary.com/dva25ei68/image/upload/v1737201532/Logo_Main-08_utkcot.png" alt="hono Logo" width="200px" padding="0" />
      </mj-column>
    </mj-section>

    <mj-section padding="40px 25px 20px" background-color="#ffffff">
      <mj-column>
        <mj-text font-size="20px" color="#020c14" font-weight="700" padding-top="0px">
          Server Error Alert 🚨
        </mj-text>
        <mj-text font-size="16px" color="#666666" padding-bottom="20px">
          Hello Admin,
        </mj-text>
        <mj-text font-size="16px" color="#666666">
          An error occurred in your application. Please review the details below:
        </mj-text>

        <mj-divider border-color="#dddddd" border-width="1px" padding="20px 0" />

        <mj-text font-size="18px" color="#020c14" font-weight="700">
          Error Details
        </mj-text>

        <mj-table padding="10px 25px">
          <tr>
            <td style="padding: 5px 0; width: 120px;"><strong>Error Code:</strong></td>
            <td style="padding: 5px 0;">{{errorCode}}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0;"><strong>Message:</strong></td>
            <td style="padding: 5px 0;">{{errorMessage}}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0;"><strong>Timestamp:</strong></td>
            <td style="padding: 5px 0;">{{timestamp}}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0;"><strong>Request URL:</strong></td>
            <td style="padding: 5px 0;">{{requestMethod}} {{requestUrl}}</td>
          </tr>
        </mj-table>

        <mj-divider border-color="#dddddd" border-width="1px" padding="20px 0" />

        <mj-text font-size="16px" color="#020c14" font-weight="700">
          Stack Trace:
        </mj-text>
        <mj-text css-class="stack-trace" font-size="13px" color="#d9534f" padding="10px 25px">
          <pre style="margin: 0;">{{stackTrace}}</pre>
        </mj-text>

        <mj-divider border-color="#dddddd" border-width="1px" padding="20px 0" />

        <mj-text font-size="16px" color="#020c14" font-weight="700">
          Request Details:
        </mj-text>
        <mj-text css-class="request-details" font-size="13px" color="#666666" padding="10px 25px">
          <pre style="margin: 0;"><strong>Headers:</strong>
{{requestHeaders}}

<strong>Query Parameters:</strong>
{{requestQuery}}

<strong>Request Body:</strong>
{{requestBody}}</pre>
        </mj-text>

        <mj-divider border-color="#dddddd" border-width="1px" padding="20px 0" />

        <mj-text font-size="16px" color="#666666">
          Please address this issue as soon as possible. For further investigation, check the server logs.
        </mj-text>
      </mj-column>
    </mj-section>

    <mj-section background-color="#ffffff" border-top="1px solid #eaeaea" padding="30px 25px">
      <mj-column>
        <mj-social padding-bottom="20px" align="center" icon-size="35px" mode="horizontal" icon-padding="10px">
          <mj-social-element name="twitter" href="https://x.com/hono" background-color="#FFFFFF" padding="0 15px" />
          <mj-social-element name="instagram" href="https://www.instagram.com/hono" background-color="#FFFFFF" padding="0 15px" />
          <mj-social-element name="linkedin" href="#" background-color="#FFFFFF" padding="0 15px" />
        </mj-social>
        <mj-text color="#666666" font-size="12px" align="center" line-height="20px">
          © 2025 hono. All rights reserved.<br />
          GRA, Port Harcourt Nigeria
        </mj-text>
        <mj-text font-size="12px" color="#666666" align="center" line-height="20px" padding-top="10px">
          <a href="#" class="footer-link">Privacy Policy</a> • <a href="#" class="footer-link">Terms of Service</a>
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
`;

export default errorTemplate;
