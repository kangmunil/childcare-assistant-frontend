const normalizeRegionName = (value) => {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/\s+/g, ' ');
};

const hasNeighborhoodSuffix = (token) => {
  if (!token) return false;
  return /[동읍면리]$/u.test(token);
};

export const getDongLabel = (regionName) => {
  const normalized = normalizeRegionName(regionName);
  if (!normalized) return '';

  const tokens = normalized.split(' ').filter(Boolean);
  for (let i = tokens.length - 1; i >= 0; i -= 1) {
    if (hasNeighborhoodSuffix(tokens[i])) {
      return tokens[i];
    }
  }
  return normalized;
};

export const getGuDongLabel = (regionName) => {
  const normalized = normalizeRegionName(regionName);
  if (!normalized) return '';

  const tokens = normalized.split(' ').filter(Boolean);
  let gu = '';
  let dong = '';

  tokens.forEach((token) => {
    if (/구$/u.test(token)) {
      gu = token;
    }
    if (hasNeighborhoodSuffix(token)) {
      dong = token;
    }
  });

  if (gu && dong) return gu === dong ? dong : `${gu} ${dong}`;
  if (dong) return dong;
  return normalized;
};

export const getRegionLabels = (regionName) => {
  const normalized = normalizeRegionName(regionName);
  return {
    raw: normalized,
    dongLabel: getDongLabel(normalized),
    guDongLabel: getGuDongLabel(normalized)
  };
};

export default getRegionLabels;
