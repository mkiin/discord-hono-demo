// Discord APIのメッセージ作成・更新関数
async function createMessage(
	content: string,
	options: { token: string; appId: string },
) {
	const { token, appId } = options;
	const url = `https://discord.com/api/v10/webhooks/${appId}/${token}`;
	return fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ content }),
	});
}

async function updateMessage(
	content: string,
	options: { token: string; appId: string },
) {
	const { token, appId } = options;
	const url = `https://discord.com/api/v10/webhooks/${appId}/${token}/messages/@original`;
	return fetch(url, {
		method: "PATCH",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ content }),
	});
}
