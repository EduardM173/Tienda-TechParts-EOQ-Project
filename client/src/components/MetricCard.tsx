    // client/src/components/MetricCard.tsx
    import React from "react";

    interface Props {
    title: string;
    value: number;
    icon: string;
    variant: "primary"|"success"|"warning"|"danger"|"info";
    }

    const MetricCard: React.FC<Props> = ({ title, value, icon, variant }) => (
    <div className="col-md-3">
        <div className={`card metric-card ${variant}`}>
        <div className="card-body">
            <i className={`bi ${icon} metric-icon`} />
            <h5 className="metric-title">{title}</h5>
            <p className="metric-value">{value}</p>
        </div>
        </div>
    </div>
    );

    export default MetricCard;
