// Netease music search API
#[tauri::command]
pub async fn search_songs(search_string: String) -> Result<String, String> {
    let url = format!(
        "https://music.163.com/api/search/get/?s={}&limit=10&offset=0&type=1",
        search_string
    );
    let client = reqwest::Client::new();
    let res = client
        .get(&url)
        .header("Referer", "https://music.163.com/")
        .header("User-Agent", "Mozilla/5.0")
        .header("Cookie", "appver=2.0.2")
        .send()
        .await
        .map_err(|e| e.to_string())?;
    let body = res.text().await.map_err(|e| e.to_string())?;
    Ok(body)
}

// Netease music lyric API
#[tauri::command]
pub async fn fetch_lyrics(song_id: u64) -> Result<String, String> {
    let url = format!(
        "https://music.163.com/api/song/lyric?id={}&lv=1&kv=1&tv=-1",
        song_id
    );
    let client = reqwest::Client::new();
    let res = client
        .get(&url)
        .header("Referer", "https://music.163.com/")
        .header("User-Agent", "Mozilla/5.0")
        .header("Cookie", "appver=2.0.2")
        .send()
        .await
        .map_err(|e| e.to_string())?;
    let body = res.text().await.map_err(|e| e.to_string())?;
    Ok(body)
}
