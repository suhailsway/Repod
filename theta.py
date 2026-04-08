import requests
import json

AIRTABLE_TOKEN = "patrshcKrmGIyZTji.bf1740c369730b655586c7b1d783a54abef760ae3035de976a6f0ac4a47bf50f"
AIRTABLE_BASE = "appHPv16UPdsghkQt"
AIRTABLE_TABLE = "tblaDHnsqtL3PWZk1"
SUPOCLIP_URL = "http://159.203.99.184:8000"
SUPOCLIP_USER_ID = "lW7aCYzHDCJtp3pJ5TqSD0xXsa8zXjSd"
ANTHROPIC_API_KEY = "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"

def generate_content(transcript):
    prompt = "You are a professional podcast content repurposer. Match the creator tone exactly - if sarcastic be sarcastic, if funny be funny, do not sanitize. TRANSCRIPT: " + transcript + " Return ONLY a JSON object with 4 keys: linkedin (150-300 words in creator voice), twitter (thread numbered 1/ 2/ etc in creator voice), newsletter (300-500 words in creator voice), shownotes (summary + bullet takeaways in creator voice). No preamble, no markdown fences."
    res = requests.post(
        "https://api.anthropic.com/v1/messages",
        headers={"x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json"},
        json={"model": "claude-opus-4-5", "max_tokens": 2000, "messages": [{"role": "user", "content": prompt}]}
    )
    text = res.json()["content"][0]["text"].replace("```json","").replace("```","").strip()
    return json.loads(text)

def run():
    url = "https://api.airtable.com/v0/" + AIRTABLE_BASE + "/" + AIRTABLE_TABLE
    headers = {"Authorization": "Bearer " + AIRTABLE_TOKEN}
    params = {"filterByFormula": "AND({task_id} != '', {video_clips} = '')"}
    res = requests.get(url, headers=headers, params=params)
    records = res.json().get("records", [])
    print("Found " + str(len(records)) + " records to process")
    for record in records:
        task_id = record["fields"].get("task_id")
        record_id = record["id"]
        task_res = requests.get(SUPOCLIP_URL + "/tasks/" + task_id, headers={"user_id": SUPOCLIP_USER_ID})
        task_data = task_res.json()
        status = task_data.get("status")
        clips = task_data.get("clips", [])
        if status == "completed" and clips:
            transcript = " ".join([c.get("text", "") for c in clips if c.get("text")])
            print("Generating content for " + record_id)
            try:
                content = generate_content(transcript)
                fields = {"video_clips": json.dumps(clips), "linkedin": content.get("linkedin",""), "twitter": content.get("twitter",""), "newsletter": content.get("newsletter",""), "shownotes": content.get("shownotes","")}
            except Exception as e:
                print("Content generation failed: " + str(e))
                fields = {"video_clips": json.dumps(clips)}
            requests.patch(url + "/" + record_id, headers={**headers, "Content-Type": "application/json"}, json={"fields": fields})
            print("Updated " + record_id)
        else:
            print("No clips yet for task " + str(task_id) + " status: " + str(status))

if __name__ == "__main__":
    run()
