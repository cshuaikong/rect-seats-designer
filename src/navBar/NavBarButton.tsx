import React, { useState } from "react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import useStage from "../hook/useStage";
import useI18n from "../hook/usei18n";
import styles from "./navbar.module.css";
import IconMap from "../components/icons/IconMap";

export type NavBarItemKind = {
  id: string;
  name: string;
  desc: string;
  icon?: string;
  "sub-button"?: NavBarItemKind[];
};

type NavBarButtonProps = {
  stage: ReturnType<typeof useStage>;
  onClick: (id: string) => void;
  data: NavBarItemKind;
  isActive?: boolean;
};

const NavBarButton: React.FC<NavBarButtonProps> = ({ 
  data, 
  onClick, 
  isActive = false 
}) => {
  const { getTranslation } = useI18n();
  const [isHovered, setIsHovered] = useState(false);
  const [selectedSubId, setSelectedSubId] = useState<string>(
    data["sub-button"]?.[0]?.id || data.id
  );

  // 获取当前显示的图标
  const getCurrentIcon = () => {
    if (data["sub-button"]) {
      const selected = data["sub-button"].find((s) => s.id === selectedSubId);
      return selected?.icon || data.icon;
    }
    return data.icon;
  };

  const handleSubClick = (subId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedSubId(subId);
    onClick(subId);
  };

  const handleMainClick = () => {
    onClick(selectedSubId);
  };

  return (
    <div
      className={styles.buttonWrapper}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <OverlayTrigger
        placement="right"
        overlay={
          <Tooltip id={`tooltip_navbar-id_${data.id}`}>
            {getTranslation("workMode", data.id, "desc")}
          </Tooltip>
        }
      >
        <button
          data-navbar-id={data.id}
          onClick={handleMainClick}
          className={`${styles.toolButton} ${isActive ? styles.active : ""}`}
        >
          {getCurrentIcon() ? (
            <IconMap iconName={getCurrentIcon()!} size={20} />
          ) : (
            <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>
              {getTranslation("hotkey", data.id, "name")}
            </span>
          )}
        </button>
      </OverlayTrigger>

      {/* 二级菜单 - 悬停时显示 */}
      {data["sub-button"] && isHovered && (
        <div className={styles.subMenu}>
          {data["sub-button"].map((sub) => (
            <button
              key={sub.id}
              onClick={(e) => handleSubClick(sub.id, e)}
              className={`${styles.subMenuItem} ${
                selectedSubId === sub.id ? styles.selected : ""
              }`}
            >
              {sub.icon && <IconMap iconName={sub.icon} size={16} />}
              <span>{sub.name}</span>
              {selectedSubId === sub.id && (
                <i className={`bi-check ${styles.checkmark}`} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default NavBarButton;
