import json
from nltk.tokenize import sent_tokenize


with open('structurepaper_before.json') as f:
    data = json.load(f)

for instance in data["sections"] :
    for j in range(len(instance['paragraphs'])) :
        text = instance['paragraphs'][j]['text']

        all_sent = sent_tokenize(text)

        instance['paragraphs'][j]['sentences'] = all_sent

    if 'title' in instance:
        text = instance['title']['text']

        all_sent = sent_tokenize(text)

        instance['title']['sentences'] = all_sent

if "abstractText" in data :
    all_sent = sent_tokenize(data["abstractText"]["text"])
    data["abstractText"]["sentences"] = all_sent

with open('structurepaper.json', 'w') as outfile:
    json.dump(data, outfile)

