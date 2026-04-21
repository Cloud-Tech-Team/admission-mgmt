/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import { StructuredUserData } from "@/types/userTypes";
import { getBranchDisplayName } from "@/app/constants/dropdownOptions";

// Register fonts if needed
// Font.register({
//   family: 'Roboto',
//   src: '/fonts/Roboto-Regular.ttf'
// });

const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "black",
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 10,
    textAlign: "center",
  },
  applicationId: {
    fontSize: 12,
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 10,
    padding: 5,
    backgroundColor: "#f0f0f0",
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    padding: 5,
  },
  label: {
    width: "40%",
    fontSize: 10,
    fontWeight: "bold",
  },
  value: {
    width: "60%",
    fontSize: 10,
  },
  footer: {
    marginTop: 30,
    fontSize: 10,
  },
  signature: {
    marginTop: 50,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  photoSection: {
    flexDirection: "row",
    marginBottom: 20,
  },
  photo: {
    width: 100,
    height: 120,
    border: "1px solid #000",
    marginRight: 20,
  },
  photoLabel: {
    fontSize: 8,
    textAlign: "center",
    marginTop: 5,
  },
  table: {
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#000",
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  tableRow: {
    flexDirection: "row",
  },
  tableCol: {
    width: "50%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 5,
  },
  tableCell: {
    fontSize: 10,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerText: {
    textAlign: "right",
    fontSize: 10,
  },
  logo: {
    width: 150,
    height: 50,
  },
  // Styles for the second page
  secondPageHeader: {
    marginBottom: 20,
    textAlign: "center",
  },
  secondPageTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 10,
  },
  secondPageSection: {
    marginBottom: 20,
  },
  secondPageText: {
    fontSize: 12,
    marginBottom: 5,
  },
  secondPageSignatureSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 30,
    fontSize: 11,
  },
  secondPageSignature: {
    width: "45%",
    textAlign: "center",
    fontSize: 11,
  },
  secondPageSignatureImage: {
    border: "1px solid #000",
    width: 100,
    height: 50,
    marginTop: 10,
  },
});

interface StudentPDFProps {
  student?: StructuredUserData;
}

const getProxiedImageUrl = (url: string) => {
  // If it’s a relative URL (e.g. "/no_img.png"), use it directly.
  if (url.startsWith("/")) return url;
  return `/api/proxyImage?url=${encodeURIComponent(url)}`;
};

const StudentPDF = ({ student }: StudentPDFProps) => {
  const studentData = student
    ? {
        name: student["Student Details"].Name || "Not provided",
        dob: student["Student Details"]["Date of Birth"] || "Not provided",
        parentName: student["Student Details"]["Parent Name"] || "Not provided",
        occupation:
          student["Student Details"]["Parent Occupation"] || "Not provided",
        address: {
          line1: `${student["Contact Address"]?.["House Name"] || ""}, ${student["Contact Address"]?.["District, City"] || ""}`,
          city: student["Contact Address"]?.["District, City"] || "Not provided",
          country: student["Contact Address"]?.["State"] || "Not provided",
        },
        state: student["Contact Address"]?.["State"] || "Not provided",
        pin: student["Contact Address"]?.Pin ? student["Contact Address"]?.Pin.toString() : "Not provided",
        email: student["Student Details"]?.Email || "Not provided",
        phoneKerala: student["Student Details"]?.["Kerala Phone"] || "Not provided",
        phoneAlternate: student["Student Details"]?.Phone || "Not provided",
        sponsor: student["Student Details"]?.["NRI Sponsor"] || "Not provided",
        relation: student["Student Details"]?.["Relationship with Applicant"] || "Not provided",
        branch: getBranchDisplayName(student["Branch Details"]?.Branch) || "CSE",
        transactionId: student["Payment"]?.["Transaction Number"] || "Not provided",
        applyingYear: student["Student Details"]?.["Academic Year"] || "Not provided",
        quota: student["Student Details"]?.["Quota"] || "NRI",
      }
    : {
        // Your default mock data
        name: "John Doe",
        dob: "01/01/2000",
        parentName: "Jane Doe",
        occupation: "Profession",
        address: {
          line1: "123 Sample St.",
          city: "Sample City",
          country: "Sample Country",
        },
        state: "Kerala",
        pin: "123456",
        email: "example@example.com",
        phoneKerala: "1234567890",
        phoneAlternate: "0987654321",
        sponsor: "Sponsor Name",
        relation: "Guardian",
        branch: "Computer Science and Engineering",
        transactionId: "TXN_9876543210",
        quota: "NRI",
      };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <Image src="/MITS.png" style={styles.logo} />
          <View style={{ ...styles.headerText, alignItems: "flex-end" }}>
            <Text>Varikoli P.O, Puthencruz - 682308</Text>
            <Text>Ernakulam - Kerala</Text>
          </View>
        </View>
        <View style={styles.header}>
          <Text style={styles.subtitle}>Application for B-Tech {studentData.quota} Quota <Text style={styles.subtitle}>{studentData.applyingYear}</Text></Text>
        </View>

        {/* Photos Section */}
        <View
          style={{
            ...styles.photoSection,
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View>
            <Text style={styles.applicationId}>
              Application No: 
            </Text>
            <Text
              style={{
                ...styles.applicationId,
                fontSize: 25,
                fontWeight: "bold",
              }}
            >
              {student?.applicationNo || "Id not found"}
            </Text>
          </View>
          <View>
            <Image
              src={getProxiedImageUrl(student?.Uploads?.studentPhoto || "/no_img.png")}
              style={styles.photo}
            />
          </View>
        </View>

        {/* Student Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Details</Text>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>1. Name of applicant</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{studentData.name}</Text>
              </View>
            </View>
            <View style={styles.tableRow}>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>2. Date of Birth</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{studentData.dob}</Text>
              </View>
            </View>
            <View style={styles.tableRow}>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>
                  3. Name of the parent/guardian
                </Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{studentData.parentName}</Text>
              </View>
            </View>
            <View style={styles.tableRow}>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>
                  4. Occupation of the parent/guardian
                </Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{studentData.occupation}</Text>
              </View>
            </View>
            <View style={styles.tableRow}>
              <View style={{ ...styles.tableCol, width: "100%" }}>
                <Text style={styles.tableCell}>5. ADDRESS</Text>
                <View style={{ marginTop: 5 }}>
                  <Text style={styles.tableCell}>
                    {studentData.address.line1}
                  </Text>
                  <Text style={styles.tableCell}>
                    {studentData.address.city}
                  </Text>
                  <Text style={styles.tableCell}>
                    {studentData.address.country}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.tableRow}>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>State: {studentData.state}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>Pin: {studentData.pin}</Text>
              </View>
            </View>
            <View style={styles.tableRow}>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>6. Email</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{studentData.email}</Text>
              </View>
            </View>
            <View style={styles.tableRow}>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>7. Phone No.(Kerala)</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{studentData.phoneKerala}</Text>
              </View>
            </View>
            <View style={styles.tableRow}>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>8. Phone No.(alternate)</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>
                  {studentData.phoneAlternate}
                </Text>
              </View>
            </View>
            <View style={styles.tableRow}>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>9. Name of sponsor</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{studentData.sponsor}</Text>
              </View>
            </View>
            <View style={styles.tableRow}>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>
                  10. Relation with applicant
                </Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{studentData.relation}</Text>
              </View>
            </View>
            <View style={styles.tableRow}>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>11. Selected Branch</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{studentData.branch}</Text>
              </View>
            </View>
            <View style={styles.tableRow}>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>12. Transaction ID</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>
                  {studentData.transactionId}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View
          style={[
            styles.footer,
            { position: "absolute", bottom: 20, left: 0, right: 0 },
          ]}
        >
          <Text style={{ textAlign: "center", marginTop: 10 }}>
            This file was generated on {new Date().toLocaleDateString()}
          </Text>
          <Text
            style={{ textAlign: "center", marginTop: 10 }}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
            fixed
          />
        </View>
      </Page>
      {/* Second Page */}
      <Page size="A4" style={styles.page}>
        <View style={styles.headerContainer}>
          <Image src="/MITS.png" style={styles.logo} />
          <View style={{ ...styles.headerText, alignItems: "flex-end" }}>
            <Text>Varikoli P.O, Puthencruz - 682308</Text>
            <Text>Ernakulam - Kerala</Text>
          </View>
        </View>

        <View style={styles.secondPageHeader}>
          <Text style={styles.secondPageTitle}>UNDERTAKING</Text>
        </View>

        <View style={styles.secondPageSection}>
          <Text style={styles.secondPageText}>
            <Text style={{ fontWeight: "bold" }}>GROUP A</Text>
            {"\n"}I am aware about the criteria followed by &quot;Muthoot
            Institute of Technology and Science&quot;, for the B-Tech {studentData.quota} Quota
            admission for the year {studentData.applyingYear}, such that my ward
            has to attain 80% Marks for Mathematics individually and 80% put
            together in Physics, Chemistry & Mathematics, in the 12th standard,
            for Qualifying examination (CBSE/ISC) OR attain 80% Marks for
            Mathematics individually and 80% put together in Physics, Chemistry
            & Mathematics, in the 12th standard(Terminal- evaluation TE), for
            Qualifying examination(State Board). If my ward failed to do so,
            there is no claim, from my side for the admission.
          </Text>
        </View>

        <View style={styles.secondPageSection}>
          <Text style={styles.secondPageText}>
            <Text style={{ fontWeight: "bold" }}>GROUP B</Text>
            {"\n"}I am aware about the criteria followed by &quot;Muthoot
            Institute of Technology and Science&quot;, for the B-Tech {studentData.quota} Quota
            admission for the year {studentData.applyingYear}, such that my ward
            has to attain 75% Marks for Mathematics individually and 75% put
            together in Physics, Chemistry & Mathematics, in the 12th standard,
            for Qualifying examination (CBSE/ISC) OR attain 75% Marks for
            Mathematics individually and 75% put together in Physics, Chemistry
            & Mathematics, in the 12th standard(Terminal- evaluation TE), for
            Qualifying examination(State Board). If my ward failed to do so,
            there is no claim, from my side for the admission.
          </Text>
        </View>

        <View style={styles.secondPageSection}>
          <Text style={styles.secondPageText}>
            <Text style={{ fontWeight: "bold" }}>EXIT OPTION</Text>
            {"\n"}1. A student can opt to{" "}
            <Text style={{ backgroundColor: "yellow" }}> EXIT </Text>
            from {studentData.quota} quota before 5 days, after the publication of{" "}
            <Text style={{ backgroundColor: "yellow" }}>
              KEAM {studentData.applyingYear} SCORE/answer key
            </Text>{" "}
            and will be reimbursed with the entire amount after deducting Rs
            1000 as processing fee. However, a student will be automatically
            considered for MITS Management Merit Quota from {studentData.quota} quota if he
            desires so and has to{" "}
            <Text style={{ backgroundColor: "yellow" }}>freeze</Text> the
            registration in MITS by sending an email to admissions@mgits.ac.in.{" "}
            <Text style={{ backgroundColor: "yellow" }}>Request</Text> for exit
            should be mailed to{" "}
            <Text style={{ backgroundColor: "yellow" }}>
              admissions@mgits.ac.in
            </Text>{" "}
            within the stipulated time. There after the registered choice will
            be frozen and will not be eligible for any refund, if the admission
            is cancelled after 5 days from the date of KEAM SCORE publication.
          </Text>
        </View>

        <View style={styles.secondPageSignatureSection}>
          <View
            style={{ ...styles.secondPageSignature, alignItems: "flex-start" }}
          >
            <Text style={{ marginBottom: 5 }}>
              Name of the parent/guardian: {studentData.parentName}
            </Text>
            <Text style={{ marginBottom: 5 }}>
              Date: {new Date().toLocaleDateString()}
            </Text>
            <Text style={{ marginBottom: 5 }}>
              Signature of parent/guardian
            </Text>
            {/* <Image src="/no_img.png" style={styles.secondPageSignatureImage} /> */}
            <Image
              src={getProxiedImageUrl(student?.Uploads?.parentSignature || "/no_img.png")}
              style={styles.secondPageSignatureImage}
            />
          </View>
          <View
            style={{ ...styles.secondPageSignature, alignItems: "flex-end" }}
          >
            <Text style={{ marginBottom: 5 }}>Signature of applicant</Text>
            <Image
              src={getProxiedImageUrl(student?.Uploads?.studentSignature || "/no_img.png")}
              style={styles.secondPageSignatureImage}
            />
          </View>
        </View>

        {/* Footer */}
        <View
          style={[
            styles.footer,
            { position: "absolute", bottom: 20, left: 0, right: 0 },
          ]}
        >
          <Text style={{ textAlign: "center", marginTop: 10 }}>
            This file was generated on {new Date().toLocaleDateString()}
          </Text>
          <Text
            style={{ textAlign: "center", marginTop: 10 }}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
            fixed
          />
        </View>
      </Page>
    </Document>
  );
};

export default StudentPDF;
