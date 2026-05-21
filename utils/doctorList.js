const Doctor = require("../models/Doctor");

const VALID_STATUSES = ["PENDING", "APPROVED", "REJECTED"];
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parseListQuery = (query = {}, fixedStatus = null) => {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const hasLimit = query.limit !== undefined && query.limit !== "";
    const limit = hasLimit
        ? Math.min(MAX_LIMIT, Math.max(1, parseInt(query.limit, 10) || DEFAULT_LIMIT))
        : 0;

    let status = fixedStatus;

    if (!status && query.status) {
        const normalized = String(query.status).trim().toUpperCase();
        if (VALID_STATUSES.includes(normalized)) {
            status = normalized;
        }
    }

    const search = String(query.search || "").trim();

    return { page, limit, status, search, paginate: hasLimit };
};

const buildDoctorFilter = ({ status, search }) => {
    const filter = {};

    if (status && VALID_STATUSES.includes(status)) {
        filter.status = status;
    }

    if (search) {
        const regex = new RegExp(escapeRegex(search), "i");
        filter.$or = [
            { fullName: regex },
            { email: regex },
            { specialization: regex },
            { doctorId: regex },
        ];
    }

    return filter;
};

const fetchDoctorList = async (query = {}, fixedStatus = null) => {
    const { page, limit, status, search, paginate } = parseListQuery(query, fixedStatus);
    const filter = buildDoctorFilter({ status, search });

    const total = await Doctor.countDocuments(filter);
    const totalPages = paginate ? Math.max(1, Math.ceil(total / limit)) : 1;
    const currentPage = paginate ? Math.min(page, totalPages) : 1;
    const skip = paginate ? (currentPage - 1) * limit : 0;

    let queryBuilder = Doctor.find(filter).select("-password").sort({ createdAt: -1 });

    if (paginate) {
        queryBuilder = queryBuilder.skip(skip).limit(limit);
    }

    const doctors = await queryBuilder.lean();

    return {
        count: total,
        currentPage,
        totalPages,
        limit: paginate ? limit : total,
        doctors,
    };
};

module.exports = {
    VALID_STATUSES,
    parseListQuery,
    buildDoctorFilter,
    fetchDoctorList,
};
