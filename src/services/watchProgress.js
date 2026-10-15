
import api from "./api";

export async function getSeriesProgress(seriesId) {
  const { data } = await api.get(
    `/series/${seriesId}/progress`
  );

  return data.progress;
}

export async function saveSeriesProgress(seriesId, payload) {
  const { data } = await api.put(
    `/series/${seriesId}/progress`,
    payload
  );

  return data.progress;
}
