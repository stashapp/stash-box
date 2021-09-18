import requests
import math
import gzip
import json
import datetime

import config

class StashBoxInterface:
	port = ""
	url = ""
	headers = {
		"Accept-Encoding": "gzip, deflate, br",
		"Content-Type": "application/json",
		"Accept": "application/json",
		"Connection": "keep-alive",
		"ApiKey": config.api_key,
		"DNT": "1"
		}

	def __init__(self):
		self.url = config.server_url

	def __callGraphQL(self, query, variables = None):
		json = {}
		json['query'] = query
		if variables != None:
			json['variables'] = variables
		
		# handle cookies
		response = requests.post(self.url, json=json, headers=self.headers)
		
		if response.status_code == 200:
			result = response.json()
			if result.get("errors", None):
				for error in result["errors"]:
					raise Exception("GraphQL error: {}".format(error))
			if result.get("data", None):
				return result.get("data")
		else:
			raise Exception("GraphQL query failed:{} - {}. Query: {}. Variables: {}".format(response.status_code, response.content, query, variables))

	def createScene(self, input):
		query = """
mutation sceneCreate($input:SceneCreateInput!) {
  sceneCreate(input: $input) {
    id
  }
}
		"""

		variables = {'input': input}

		result = self.__callGraphQL(query, variables)
		return result["sceneCreate"]

	def isSceneExist(self, url):
		query = """
query queryScenes($scene_filter: SceneFilterType, $querySpec:QuerySpec) {
  queryScenes(scene_filter: $scene_filter, filter: $querySpec) {
    count
  }
}
		"""

		variables = {
			'querySpec': {
				'per_page': 1
			},
			'scene_filter': {
				'url': url
			}
		}

		result = self.__callGraphQL(query, variables)
		return result["queryScenes"].count > 0

	def performerIDByName(self, name):
		query = """
query queryPerformers($performer_filter: PerformerFilterType, $querySpec:QuerySpec) {
  queryPerformers(performer_filter: $performer_filter, filter: $querySpec) {
    performers {
      id
	}
  }
}
		"""

		variables = {
			'querySpec': {
				'per_page': 1
			},
			'performer_filter': {
				'name': '"{}"'.format(name)
			}
		}

		result = self.__callGraphQL(query, variables)
		performers = result["queryPerformers"]["performers"]
		if len(performers) > 0:
			return performers[0]["id"]
		
		return None

	def studioIDByName(self, name):
		query = """
query findStudio($name: String) {
  findStudio(name: $name) {
    id
  }
}
		"""

		variables = {
			'name': name
		}

		result = self.__callGraphQL(query, variables)
		studio = result["findStudio"]
		if studio != None:
			return studio["id"]
		
		return None

	def tagIDByName(self, name):
		query = """
query findTag($name: String) {
  findTag(name: $name) {
    id
  }
}
		"""

		variables = {
			'name': name
		}

		result = self.__callGraphQL(query, variables)
		studio = result["findTag"]
		if studio != None:
			return studio["id"]
		
		return None