type PostData = {
	status: "draft" | "published" | "archived" | "premiere";
	pubDate: Date;
};

export function isPostVisible(data: PostData): boolean {
	if (data.status === "published") return true;
	if (data.status === "premiere") return new Date() >= data.pubDate;
	return false;
}
