export interface NewsletterData {
	weekLabel: string;
	dateRange: string;
	shipped: string[];
	til: string;
	usefulLink: { title: string; url: string; description: string };
	insight: string;
}

function escapeHtml(str: string): string {
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

const LOGO_URL =
	"https://www.railly.dev/favicon/favicon-96x96.png";

export function buildNewsletterHTML(data: NewsletterData): string {
	const shippedItems = data.shipped
		.map(
			(item) =>
				`<tr><td style="padding:0 0 10px 0;color:#525252;font-size:14px;line-height:1.7;">
					<span style="color:#a3a3a3;margin-right:8px;">&#8250;</span>${escapeHtml(item)}
				</td></tr>`,
		)
		.join("");

	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(data.weekLabel)} - railly.dev</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f4;font-family:'IBM Plex Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f4;">
<tr><td align="center" style="padding:40px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#FDFDFC;border-radius:8px;border:1px solid #e5e5e5;">

<!-- Logo + Header -->
<tr><td style="padding:32px 32px 0 32px;">
	<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
	<tr>
		<td style="width:28px;vertical-align:middle;">
			<img src="${LOGO_URL}" alt="railly.dev" width="28" height="28" style="display:block;border-radius:50%;border:0;" />
		</td>
		<td style="padding-left:10px;vertical-align:middle;">
			<span style="font-size:14px;font-weight:600;color:#111111;letter-spacing:-0.01em;">Railly Hugo</span>
		</td>
		<td align="right" style="font-size:13px;color:#a3a3a3;vertical-align:middle;">${escapeHtml(data.dateRange)}</td>
	</tr>
	</table>
</td></tr>

<!-- Divider -->
<tr><td style="padding:20px 32px 0 32px;"><div style="border-bottom:1px solid #e5e5e5;"></div></td></tr>

<!-- Greeting -->
<tr><td style="padding:28px 32px 8px 32px;">
	<p style="margin:0;font-size:14px;color:#a3a3a3;">Hey {{{FIRST_NAME|there}}},</p>
</td></tr>

<!-- Title -->
<tr><td style="padding:0 32px 32px 32px;">
	<h1 style="margin:0;font-size:22px;font-weight:500;color:#111111;line-height:1.4;font-family:'IBM Plex Serif',Georgia,serif;letter-spacing:-0.02em;">
		${escapeHtml(data.weekLabel)}
	</h1>
</td></tr>

<!-- Shipped -->
<tr><td style="padding:0 32px 24px 32px;">
	<h2 style="margin:0 0 14px 0;font-size:11px;font-weight:600;color:#a3a3a3;letter-spacing:0.1em;text-transform:uppercase;">What I Shipped</h2>
	<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
		${shippedItems}
	</table>
</td></tr>

<!-- Divider -->
<tr><td style="padding:0 32px 24px 32px;"><div style="border-bottom:1px solid #e5e5e5;"></div></td></tr>

<!-- TIL -->
<tr><td style="padding:0 32px 24px 32px;">
	<h2 style="margin:0 0 14px 0;font-size:11px;font-weight:600;color:#a3a3a3;letter-spacing:0.1em;text-transform:uppercase;">TIL</h2>
	<p style="margin:0;font-size:14px;color:#525252;line-height:1.7;">${escapeHtml(data.til)}</p>
</td></tr>

<!-- Divider -->
<tr><td style="padding:0 32px 24px 32px;"><div style="border-bottom:1px solid #e5e5e5;"></div></td></tr>

<!-- Useful Link -->
<tr><td style="padding:0 32px 24px 32px;">
	<h2 style="margin:0 0 14px 0;font-size:11px;font-weight:600;color:#a3a3a3;letter-spacing:0.1em;text-transform:uppercase;">Worth Checking Out</h2>
	<a href="${escapeHtml(data.usefulLink.url)}" style="color:#111111;font-size:14px;font-weight:500;text-decoration:underline;text-underline-offset:3px;text-decoration-color:#d4d4d4;">${escapeHtml(data.usefulLink.title)}</a>
	<p style="margin:6px 0 0 0;font-size:14px;color:#525252;line-height:1.7;">${escapeHtml(data.usefulLink.description)}</p>
</td></tr>

<!-- Divider -->
<tr><td style="padding:0 32px 24px 32px;"><div style="border-bottom:1px solid #e5e5e5;"></div></td></tr>

<!-- Insight -->
<tr><td style="padding:0 32px 32px 32px;">
	<h2 style="margin:0 0 14px 0;font-size:11px;font-weight:600;color:#a3a3a3;letter-spacing:0.1em;text-transform:uppercase;">One Thought</h2>
	<p style="margin:0;font-size:14px;color:#525252;line-height:1.7;font-style:italic;font-family:'IBM Plex Serif',Georgia,serif;">${escapeHtml(data.insight)}</p>
</td></tr>

<!-- Footer -->
<tr><td style="padding:0 32px 32px 32px;border-top:1px solid #e5e5e5;">
	<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
	<tr><td style="padding-top:24px;font-size:12px;color:#a3a3a3;line-height:1.6;">
		<a href="https://www.railly.dev" style="color:#525252;text-decoration:underline;text-underline-offset:3px;text-decoration-color:#d4d4d4;">railly.dev</a>
		<span style="margin:0 8px;color:#d4d4d4;">&#183;</span>
		<a href="https://x.com/raillyhugo" style="color:#525252;text-decoration:underline;text-underline-offset:3px;text-decoration-color:#d4d4d4;">X</a>
		<span style="margin:0 8px;color:#d4d4d4;">&#183;</span>
		<a href="https://github.com/Railly" style="color:#525252;text-decoration:underline;text-underline-offset:3px;text-decoration-color:#d4d4d4;">GitHub</a>
	</td></tr>
	<tr><td style="padding-top:12px;font-size:11px;color:#c4c4c4;">
		<a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#c4c4c4;text-decoration:underline;text-underline-offset:2px;">Unsubscribe</a>
	</td></tr>
	</table>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}
