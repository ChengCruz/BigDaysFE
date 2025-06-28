// src/components/pages/Tables/TableDetail.tsx
import { NavLink, Outlet } from "react-router-dom";
export default function TableDetail() {

  return (
    <div className="space-y-4">
      {/* you can also pull name/capacity here if you like—but summary will do it */}
      <nav className="border-b pb-2 flex space-x-4">
        {[
          ["","Summary"],
          ["assignments","Assign Guests"],
          ["layout","Layout"],
          ["print","Print"],
          ["edit","Edit"],
        ].map(([path,label]) => (
          <NavLink
            key={path}
            to={path}
            end={path===""}   // so that “/tables/:id” matches the summary tab
            className={({isActive})=>
              isActive ? "border-b-2 border-button" : undefined
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>

      {/* this is where summary/assign/layout/print/edit will render */}
      <Outlet />
    </div>
  );
}
