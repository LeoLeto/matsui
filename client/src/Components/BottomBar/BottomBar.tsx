import "./BottomBar.scss";
import { Link, useLocation } from "react-router-dom";
import { pages } from "../../Constants/pages";
import { FaSignOutAlt } from "react-icons/fa";
export default function BottomBar() {
  const location = useLocation();

  return (
    <>
      <div className="bottomBarContainer">
        <nav>
          <ul>
            {pages.map((page) => {
              const Icon = page.icon;
              return (
                <li
                  key={page.path}
                  className={location.pathname === page.path ? "active" : ""}
                >
                  <Link to={page.path}>
                    <Icon className="bottomBarIcon" />
                    <div>{page.mobileLabel}</div>
                  </Link>
                </li>
              );
            })}
            <Link to="/login" className="logout">
              <FaSignOutAlt className="signOutIcon" />
            </Link>
          </ul>
        </nav>
      </div>
    </>
  );
}
