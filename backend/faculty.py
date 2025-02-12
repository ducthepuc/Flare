import requests

# print(requests.post("http://127.0.0.1:5000/api/lur/py", json={
#     "code": """test()""",
#     "env_data": {
#          '__builtins__':  ["min", "max"],
#         'test': "lambda : print('hi cat')"
#     }
# }).json())

# print(requests.get("http://127.0.0.1:5000/api/course/1/stars", headers = {
#     "Authorization": "LytZWiufuePDvVEp2znyTDGfow3TKk"
# }).json())

print(requests.get("http://localhost:5000/api/users/top", headers = {
    "Authorization": "LytZWiufuePDvVEp2znyTDGfow3TKk"
}).json())

# print(requests.post("http://127.0.0.1:5000/api/course/1/stars", headers = {
#     "Authorization": "LytZWiufuePDvVEp2znyTDGfow3TKk"
# }).json())

# print(requests.delete("http://127.0.0.1:5000/api/course/1/stars", headers = {
#     "Authorization": "LytZWiufuePDvVEp2znyTDGfow3TKk"
# }).json())