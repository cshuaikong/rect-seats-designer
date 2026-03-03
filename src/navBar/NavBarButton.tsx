import React, { useState } from "react";
import { Button, ButtonGroup, OverlayTrigger, Tooltip } from "react-bootstrap";
import colorStyles from "../style/color.module.css";
import borderStyles from "../style/border.module.css";
import useStage from "../hook/useStage";
import useI18n from "../hook/usei18n";

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
};

const NavBarButton: React.FC<NavBarButtonProps> = ({ data, onClick }) => {
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

  // 获取当前显示的名称
  const getCurrentName = () => {
    if (data["sub-button"]) {
      const selected = data["sub-button"].find((s) => s.id === selectedSubId);
      return selected?.name || data.name;
    }
    return data.name;
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
      className="position-relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ zIndex: isHovered ? 1000 : 1 }}
    >
      <ButtonGroup vertical>
        <OverlayTrigger
          placement="right"
          overlay={
            <Tooltip id={`tooltip_navbar-id_${data.id}`}>
              {getTranslation("workMode", data.id, "desc")}
            </Tooltip>
          }
        >
          <Button
            data-navbar-id={data.id}
            onClick={handleMainClick}
            className={[
              colorStyles.whiteTheme,
              borderStyles.colorGrey,
              "d-flex",
              "align-items-center",
              "justify-content-center",
            ].join(" ")}
            style={{ width: "48px", height: "48px" }}
          >
            {getCurrentIcon() ? (
              <i className={`bi-${getCurrentIcon()}`} style={{ fontSize: "1.2rem" }} />
            ) : (
              getTranslation("hotkey", data.id, "name")
            )}
          </Button>
        </OverlayTrigger>
      </ButtonGroup>

      {/* 二级菜单 - 悬停时显示 */}
      {data["sub-button"] && isHovered && (
        <div
          className="position-absolute"
          style={{
            left: "52px",
            top: "0",
            zIndex: 9999,
            backgroundColor: "#2c3e50",
            borderRadius: "4px",
            padding: "4px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            minWidth: "140px",
          }}
        >
          <ButtonGroup vertical>
            {data["sub-button"].map((sub) => (
              <OverlayTrigger
                key={sub.id}
                placement="right"
                overlay={<Tooltip id={`tooltip-${sub.id}`}>{sub.desc}</Tooltip>}
              >
                <Button
                  variant={selectedSubId === sub.id ? "primary" : "dark"}
                  size="sm"
                  onClick={(e) => handleSubClick(sub.id, e)}
                  className="d-flex align-items-center gap-2"
                  style={{
                    minWidth: "120px",
                    justifyContent: "flex-start",
                    padding: "8px 12px",
                  }}
                >
                  {sub.icon && <i className={`bi-${sub.icon}`} />}
                  <span style={{ fontSize: "0.85rem" }}>{sub.name}</span>
                  {selectedSubId === sub.id && (
                    <i className="bi-check ms-auto" />
                  )}
                </Button>
              </OverlayTrigger>
            ))}
          </ButtonGroup>
        </div>
      )}
    </div>
  );
};

export default NavBarButton;
