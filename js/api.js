let cache = null;

export async function fetchJobs() {
  if (cache) return cache;

  const res = await fetch("./data/jobs.json");
  if (!res.ok) throw new Error("Failed to load jobs.json");

  cache = await res.json();
  return cache;
}

export async function fetchJobById(id) {
  const jobs = await fetchJobs();
  return jobs.find((j) => String(j.id) === String(id));
}
