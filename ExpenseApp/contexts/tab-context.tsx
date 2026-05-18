import React from "react";

interface TabContextType {
  activeIndex: number;
  goTo: (index: number) => void;
}

const TabContext = React.createContext<TabContextType>({
  activeIndex: 0,
  goTo: () => {},
});

export const useTabContext = () => React.useContext(TabContext);

/** Devuelve true solo cuando el tab en `index` está activo */
export const useTabFocus = (index: number) => {
  const { activeIndex } = useTabContext();
  return activeIndex === index;
};

export const TabProvider = ({
  children,
  value,
}: {
  children: React.ReactNode;
  value: TabContextType;
}) => <TabContext.Provider value={value}>{children}</TabContext.Provider>;
