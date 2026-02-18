type PostData = {
	status: "draft" | "published" | "archived" | "premiere";
	pubDate: Date;
};

export function isPostVisible(data: PostData): boolean {
	if (data.status === "published") return true;
	if (data.status === "premiere") return new Date() >= data.pubDate;
	return false;
}

export function isPostPremiere(data: PostData): boolean {
	return data.status === "premiere" && new Date() < data.pubDate;
}

export function isPostListable(data: PostData): boolean {
	return isPostVisible(data) || isPostPremiere(data);
}
