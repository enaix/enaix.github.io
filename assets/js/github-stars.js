function fetchGitHubStars(repo_owner, repo_name) {
  return new Promise(function(resolve, reject) {
    var cacheKey = `github_stars_${repo_owner}_${repo_name}`;
    var cachedStars = sessionStorage.getItem(cacheKey);
    if (cachedStars !== null) {
      resolve(parseInt(cachedStars));
      return;
    }

    let xhr = new XMLHttpRequest();
    xhr.open('GET', `https://api.github.com/repos/${repo_owner}/${repo_name}`, true);
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          let data = JSON.parse(xhr.responseText);
          var stars = data.stargazers_count;
          sessionStorage.setItem(cacheKey, stars);
          resolve(stars);
        } else {
          reject(new Error(xhr.statusText || 'Failed to fetch stars'));
        }
      }
    };
    xhr.onerror = function() {
      reject(new Error('Failed to fetch stars'));
    };
    xhr.send();
  });
}

function toggleVisibility(elem, show)
{
    if (show)
    {
        elem.classList.remove("stars-hidden")
    }
    else
    {
        elem.classList.add("stars-hidden")
    }
}

function executeFetch(owner, repo)
{
  fetchGitHubStars(owner, repo)
  .then(function(stars) {
    if (stars !== null) {
      console.log(`The repository ${owner}/${repo} has ${stars} stars.`);
      
      toggleVisibility(document.getElementById("div-" + repo), true);
      document.getElementById("star-" + repo).innerHTML = stars;
      if (stars % 10 == 1 && stars % 100 != 11) // Ends with 1, but not with 11
      {
        toggleVisibility(document.getElementById("star-s-" + repo), false); // star
      }
      else
      {
        toggleVisibility(document.getElementById("star-s-" + repo), true); // stars
      }
    } else {
      console.log('Failed to fetch stars for repo ${owner}/${repo}');
      toggleVisibility(document.getElementById("div-" + repo), false);
    }
  })
  .catch(function(error) {
    console.error('Error fetching stars:', error);
    toggleVisibility(document.getElementById("div-" + repo), false);
  });
}

executeFetch(document.currentScript.getAttribute("owner"), document.currentScript.getAttribute("repo"));

