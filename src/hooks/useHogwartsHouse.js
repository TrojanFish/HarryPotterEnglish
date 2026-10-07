import { useState, useEffect, useCallback } from 'react';
import { HOUSES, getHouse } from '../constants/hogwartsTheme.js';

const HOUSE_STORAGE_KEY = 'hp_user_house';

export function getSavedHouse() {
  try {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(HOUSE_STORAGE_KEY);
      if (stored && HOUSES[stored]) {
        return stored;
      }
    }
  } catch (err) {
    console.warn('Failed to read house from localStorage', err);
  }
  return 'gryffindor';
}

export function saveHouse(houseId) {
  try {
    const validId = HOUSES[houseId] ? houseId : 'gryffindor';
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(HOUSE_STORAGE_KEY, validId);
    }
  } catch (err) {
    console.warn('Failed to save house to localStorage', err);
  }
}

export function applyHouseThemeToDom(houseId) {
  if (typeof document === 'undefined' || !document.documentElement) return;
  const house = getHouse(houseId);
  const docElem = document.documentElement;

  docElem.setAttribute('data-house', house.id);

  if (docElem.style && docElem.style.setProperty) {
    docElem.style.setProperty('--c-house-primary', house.primaryColor);
    docElem.style.setProperty('--c-house-accent', house.accentColor);
    docElem.style.setProperty('--c-house-border', house.borderColor);
    docElem.style.setProperty('--c-house-bg', house.bgLight);
    docElem.style.setProperty('--c-house-gem', house.gemColor);
  }
}

export function useHogwartsHouse() {
  const [currentHouse, setCurrentHouse] = useState(() => getSavedHouse());

  useEffect(() => {
    applyHouseThemeToDom(currentHouse);
  }, [currentHouse]);

  const selectHouse = useCallback((houseId) => {
    const targetId = HOUSES[houseId] ? houseId : 'gryffindor';
    saveHouse(targetId);
    setCurrentHouse(targetId);
    applyHouseThemeToDom(targetId);
  }, []);

  const houseData = getHouse(currentHouse);

  return {
    currentHouse,
    houseData,
    selectHouse
  };
}

export default useHogwartsHouse;
