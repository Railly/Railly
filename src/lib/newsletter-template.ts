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

export function buildNewsletterHTML(data: NewsletterData): string {
	const shippedItems = data.shipped
		.map(
			(item) =>
				`<tr><td style="padding:0 0 8px 0;color:#a3a3a3;font-size:14px;line-height:1.6;">
					<span style="color:#525252;margin-right:8px;">&#8250;</span>${escapeHtml(item)}
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
<body style="margin:0;padding:0;background-color:#111111;font-family:'IBM Plex Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#111111;">
<tr><td align="center" style="padding:40px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

<!-- Header -->
<tr><td style="padding:0 0 32px 0;">
	<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
	<tr>
		<td style="font-size:13px;color:#525252;letter-spacing:0.05em;text-transform:uppercase;">railly.dev</td>
		<td align="right" style="font-size:13px;color:#525252;">${escapeHtml(data.dateRange)}</td>
	</tr>
	</table>
	<div style="border-bottom:1px solid #262626;margin-top:16px;"></div>
</td></tr>

<!-- Title -->
<tr><td style="padding:0 0 32px 0;">
	<h1 style="margin:0;font-size:20px;font-weight:500;color:#fafafa;line-height:1.4;font-family:'IBM Plex Serif',Georgia,serif;">
		${escapeHtml(data.weekLabel)}
	</h1>
</td></tr>

<!-- Shipped -->
<tr><td style="padding:0 0 28px 0;">
	<h2 style="margin:0 0 12px 0;font-size:11px;font-weight:500;color:#525252;letter-spacing:0.1em;text-transform:uppercase;">What I Shipped</h2>
	<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
		${shippedItems}
	</table>
</td></tr>

<!-- Divider -->
<tr><td style="padding:0 0 28px 0;"><div style="border-bottom:1px solid #262626;"></div></td></tr>

<!-- TIL -->
<tr><td style="padding:0 0 28px 0;">
	<h2 style="margin:0 0 12px 0;font-size:11px;font-weight:500;color:#525252;letter-spacing:0.1em;text-transform:uppercase;">TIL</h2>
	<p style="margin:0;font-size:14px;color:#a3a3a3;line-height:1.6;">${escapeHtml(data.til)}</p>
</td></tr>

<!-- Divider -->
<tr><td style="padding:0 0 28px 0;"><div style="border-bottom:1px solid #262626;"></div></td></tr>

<!-- Useful Link -->
<tr><td style="padding:0 0 28px 0;">
	<h2 style="margin:0 0 12px 0;font-size:11px;font-weight:500;color:#525252;letter-spacing:0.1em;text-transform:uppercase;">Worth Checking Out</h2>
	<a href="${escapeHtml(data.usefulLink.url)}" style="color:#fafafa;font-size:14px;text-decoration:underline;text-underline-offset:3px;text-decoration-color:#525252;">${escapeHtml(data.usefulLink.title)}</a>
	<p style="margin:6px 0 0 0;font-size:14px;color:#a3a3a3;line-height:1.6;">${escapeHtml(data.usefulLink.description)}</p>
</td></tr>

<!-- Divider -->
<tr><td style="padding:0 0 28px 0;"><div style="border-bottom:1px solid #262626;"></div></td></tr>

<!-- Insight -->
<tr><td style="padding:0 0 32px 0;">
	<h2 style="margin:0 0 12px 0;font-size:11px;font-weight:500;color:#525252;letter-spacing:0.1em;text-transform:uppercase;">One Thought</h2>
	<p style="margin:0;font-size:14px;color:#a3a3a3;line-height:1.6;font-style:italic;">${escapeHtml(data.insight)}</p>
</td></tr>

<!-- Footer -->
<tr><td style="padding:24px 0 0 0;border-top:1px solid #262626;">
	<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
	<tr><td style="font-size:12px;color:#525252;line-height:1.6;">
		<a href="https://www.railly.dev" style="color:#525252;text-decoration:underline;text-underline-offset:3px;">railly.dev</a>
		<span style="margin:0 8px;">&#183;</span>
		<a href="https://x.com/raillyhugo" style="color:#525252;text-decoration:underline;text-underline-offset:3px;">X</a>
		<span style="margin:0 8px;">&#183;</span>
		<a href="https://github.com/Railly" style="color:#525252;text-decoration:underline;text-underline-offset:3px;">GitHub</a>
	</td></tr>
	<tr><td style="padding-top:12px;font-size:11px;color:#3a3a3a;">
		<a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#3a3a3a;text-decoration:underline;">Unsubscribe</a>
	</td></tr>
	</table>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}
